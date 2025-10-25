const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.TransferRequest.findAll({
    include: [
      { model: db.TransferDetail, as: 'transferDetails' }
    ],
  });
}

async function findById(id) {
  return db.TransferRequest.findByPk(id, {
    include: [
      { model: db.TransferDetail, as: 'transferDetails' }
    ],
  });
}

async function requestTransfer(user, request_quantity, notes) {
  const now = new Date();
  const activeShift = await db.Shift.findOne({
    where: {
      staff_id: user.account_id,
      start_time: { [db.Sequelize.Op.lte]: now },
      end_time: { [db.Sequelize.Op.gte]: now },
    },
  });
  if (!activeShift) throw new ApiError(400, "You do not have any active shift at this current time");
  
  const pendingRequest = await db.TransferRequest.findOne({
    where: {
      staff_id: user.account_id,
      status: 'pending'
    }
  });
  if (pendingRequest) throw new ApiError(400, "You have already requested a transfer order");

  return db.TransferRequest.create({
    station_id: activeShift.station_id,
    staff_id: user.account_id,
    request_quantity,
    request_time: now,
    notes: notes || ""
  });
}

async function approveTransfer(user, transfer_request_id, transfer_details) {
  // transfer_details = [
  //   { station_id: 1, transfer_quantity: 4 },
  //   { station_id: 2, transfer_quantity: 8 }
  // ]

  // start a transaction
  const t = await db.sequelize.transaction();

  try {
    const request = await db.TransferRequest.findByPk(transfer_request_id, { transaction: t });
    if (!request) throw new ApiError(404, 'Transfer request not found.');
    if (request.status !== 'pending') throw new ApiError(400, `Cannot approve a transfer request with status '${request.status}'`);

    request.status = 'approved';
    request.admin_id = user.account_id;
    request.resolve_time = new Date();
    await request.save({ transaction: t });

    const totalTransferQuantity = transfer_details.reduce((sum, d) => sum + d.transfer_quantity, 0);
    if (totalTransferQuantity !== request.request_quantity) {
      throw new ApiError(400, `Total transfer quantity (${totalTransferQuantity}) does not match requested quantity (${request.request_quantity}).`);
    }

    const details = [];

    for (const { station_id, transfer_quantity } of transfer_details) {
      const availableBatteries = await db.Battery.findAll({
        include: [
          {
            model: db.CabinetSlot,
            as: 'cabinetSlot',
            required: true,
            where: { status: { [db.Sequelize.Op.in]: ['charging', 'charged'] } },
            include: [
              {
                model: db.Cabinet,
                as: 'cabinet',
                required: true,
                where: { station_id },
              },
            ],
          },
        ],
        where: {
          vehicle_id: null,
        },
        order: [['current_soc', 'DESC']],
        limit: transfer_quantity,
        transaction: t,
      });

      if (availableBatteries.length < transfer_quantity) {
        throw new ApiError(400, `Station ${station_id} does not have enough available batteries.`);
      }

      await db.Battery.update(
        { slot_id: null },
        { where: { battery_id: availableBatteries.map(b => b.battery_id) }, transaction: t }
      );

      const detail = await db.TransferDetail.create({
        transfer_request_id,
        station_id,
        staff_id: null,
        transfer_quantity,
        status: 'incompleted',
      }, { transaction: t });

      await detail.addBatteries(availableBatteries, { transaction: t });

      details.push({
        detail,
        transfer_battery_ids: availableBatteries.map(b => b.battery_id),
      });
    }

    // commit a transaction
    await t.commit();

    return {
      message: 'Transfer approved successfully.',
      transfer_request: request,
      transfer_details: details,
    };
  } catch (err) {
    await t.rollback();
    throw new ApiError(500, `Transfer approval transaction error: ${err.message}`)
  }
}

async function rejectTransfer(user, transfer_request_id) {
  const request = await db.TransferRequest.findByPk(transfer_request_id);
  if (!request) throw new ApiError(404, 'Transfer request not found');
  if (request.status !== 'pending') throw new ApiError(400, `Cannot reject a transfer request with status '${request.status}'`);

  request.status = 'rejected';
  request.admin_id = user.account_id;
  request.resolve_time = new Date();
  await request.save();
  return request;
}

async function confirmTransfer(user, transfer_detail_id) {
  const now = new Date();
  const activeShift = await db.Shift.findOne({
    where: {
      staff_id: user.account_id,
      start_time: { [db.Sequelize.Op.lte]: now },
      end_time: { [db.Sequelize.Op.gte]: now },
    },
  });
  if (!activeShift) throw new ApiError(400, "You do not have any active shift at this current time");
  
  const detail = await db.TransferDetail.findByPk(transfer_detail_id, {
    include: [
      {
        model: db.Battery,
        as: 'batteries'
      },
    ],
  });
  
  if (!detail) throw new ApiError(400, "Transfer detail not found");
  detail.staff_id = user.account_id;
  detail.confirm_time = now;
  detail.status = 'completed';
  await detail.save();

  // check all transfer completed
  const details = await db.TransferDetail.findAll({
    where: { transfer_request_id: detail.transfer_request_id },
  });

  if (details.every(d => d.status === 'completed')) {
    const req = await db.TransferRequest.findByPk(detail.transfer_request_id);
    req.status = 'completed';
    await req.save();
  }

  return detail;
}

async function cancelTransfer(user, transfer_request_id) {
  const now = new Date();
  const activeShift = await db.Shift.findOne({
    where: {
      staff_id: user.account_id,
      start_time: { [db.Sequelize.Op.lte]: now },
      end_time: { [db.Sequelize.Op.gte]: now },
    },
  });
  if (!activeShift) throw new ApiError(400, "You do not have any active shift at this current time");

  const transferReq = await db.TransferRequest.findByPk(transfer_request_id);
  if (!transferReq) throw new ApiError(404, 'Transfer request not found');

  if (transferReq.staff_id !== user.account_id) {
    throw new ApiError(403, 'Access denied: You can only cancel transfer request that you created');
  }

  if (transferReq.status !== 'pending') {
    throw new ApiError(400, 'Cannot cancel a transfer request unless it is still pending');
  }

  transferReq.status = 'cancelled';
  await transferReq.save();
  return transferReq;
}

module.exports = { findAll, findById, requestTransfer, approveTransfer, rejectTransfer, confirmTransfer, cancelTransfer };
