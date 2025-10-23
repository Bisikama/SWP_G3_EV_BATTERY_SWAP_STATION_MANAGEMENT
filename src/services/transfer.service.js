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

async function requestTransfer(user, request_quantity, notes = "") {
  const now = new Date();
  const activeShift = await db.Shift.findOne({
    where: {
      staff_id: user.account_id,
      status: 'confirmed',
      start_time: { [db.Sequelize.Op.lte]: now },
      end_time: { [db.Sequelize.Op.gte]: now },
    },
  });
  if (!activeShift) throw new ApiError(400, "You do not have any active shift at this current time");
  
  return db.TransferRequest.create({
    station_id: activeShift.station_id,
    staff_id: user.account_id,
    request_quantity,
    request_time: now,
    notes: notes || null
  });
}

async function approveTransfer(user, transfer_request_id, transfer_details) {
  // transfer_details = [
  //   { station_id: 1, transfer_quantity: 4 },
  //   { station_id: 2, transfer_quantity: 8 }
  // ]

  const request = await db.TransferRequest.findByPk(transfer_request_id);
  if (!request) throw new ApiError(404, 'Transfer request not found.');
  if (request.status === 'approved') throw new ApiError(404, 'This transfer request has already been approved');
  request.status = 'approved';
  request.admin_id = user.account_id;
  request.approve_time = new Date();
  
  const totalTransferQuantity = transfer_details.reduce((sum, detail) => sum + detail.transfer_quantity, 0);
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
        slot_id: { [db.Sequelize.Op.ne]: null },
        vehicle_id: null,
      },
      limit: transfer_quantity,
    });

    if (availableBatteries.length < transfer_quantity) {
      throw new ApiError(400, `Station ${station_id} does not have enough available batteries.`);
    }

    const detail = await db.TransferDetail.create({
      transfer_request_id,
      station_id,
      staff_id: null,
      transfer_quantity,
      status: 'transfering',
    });

    await db.Battery.update(
      { slot_id: null },
      { where: { battery_id: availableBatteries.map(b => b.battery_id) } }
    );

    
    await detail.addBatteries(availableBatteries);

    details.push({
      detail,
      assigned_battery_ids: availableBatteries.map((b) => b.battery_id),
    });
  }

  await request.save();

  return {
    message: 'Transfer approved successfully.',
    transfer_request: request,
    transfer_details: details,
  };
}

async function confirmTransfer(user, transfer_detail_id) {
  const now = new Date();
  const activeShift = await db.Shift.findOne({
    where: {
      staff_id: user.account_id,
      status: 'confirmed',
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
  detail.status = 'confirmed';
  await detail.save();

  return detail;
}

module.exports = { findAll, findById, requestTransfer, approveTransfer, confirmTransfer };
