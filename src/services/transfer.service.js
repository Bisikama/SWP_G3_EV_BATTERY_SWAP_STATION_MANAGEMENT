const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.TransferRequest.findAll({
    include: [
      { model: db.TransferOrder, as: 'transferOrders' }
    ],
  });
}

async function findById(id) {
  return db.TransferRequest.findByPk(id, {
    include: [
      { model: db.TransferOrder, as: 'transferOrders' }
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
  if (!activeShift) {
    throw new ApiError(400, "You do not have any active shift at this current time");
  }

  const pendingRequest = await db.TransferRequest.findOne({
    where: {
      station_id: activeShift.station_id,
      status: 'requested'
    }
  });
  if (pendingRequest) {
    throw new ApiError(400, "There is still a pending transfer request at this station");
  }

  return db.TransferRequest.create({
    station_id: activeShift.station_id,
    staff_id: user.account_id,
    request_quantity,
    request_time: now,
    notes: notes || ""
  });
}

async function approveTransfer(user, transfer_orders, transfer_request_id) {
  const request = await db.TransferRequest.findByPk(transfer_request_id);
  if (!request) throw new ApiError(404, 'Transfer request not found.');
  if (request.status !== 'requested') throw new ApiError(400, `Cannot approve a transfer request with status '${request.status}'`);

  const totalTransferQuantity = transfer_orders.reduce((sum, d) => sum + d.transfer_quantity, 0);
  if (totalTransferQuantity !== request.request_quantity) {
    throw new ApiError(400, `Total transfer quantity (${totalTransferQuantity}) does not match requested quantity (${request.request_quantity}).`);
  }

  const orders = await createTransfer(transfer_orders, transfer_request_id);    

  request.status = 'approved';
  request.admin_id = user.account_id;
  request.resolve_time = new Date();
  await request.save();

  return {
    message: 'Transfer approved successfully.',
    transfer_request: request,
    transfer_orders: orders,
  };
}

async function createTransfer(transfer_orders, transfer_request_id = null) {
  // transfer_orders = [
  //   { source_station_id: 2, target_station_id: 1, transfer_quantity: 4 },
  //   { source_station_id: 3, target_station_id: 1, transfer_quantity: 8 }
  // ]

  // start transaction
  const t = await db.sequelize.transaction();

  try {
    if (transfer_request_id !== null) {
      const transferRequest = await db.TransferRequest.findByPk(transfer_request_id);
      if (!transferRequest) {
        throw new ApiError(404, "Transfer request not found");
      }
    }

    const orders = [];

    for (const { source_station_id, target_station_id, transfer_quantity } of transfer_orders) {
      if (source_station_id == target_station_id) {
        throw new ApiError(400, `Source station (id:${source_station_id}) cannot be the same as Target station`)
      }

      const availableBatteries = await db.Battery.findAll({
        include: [
          {
            model: db.CabinetSlot,
            as: 'cabinetSlot',
            required: true,
            where: { status: 'occupied' },
            include: [
              {
                model: db.Cabinet,
                as: 'cabinet',
                required: true,
                where: { station_id: source_station_id },
              },
            ],
          },
        ],
        where: {
          vehicle_id: null,
          current_soc: { [db.Sequelize.Op.gte]: 90.00 }
        },
        order: [['current_soc', 'DESC']],
        limit: transfer_quantity,
        transaction: t,
      });

      if (availableBatteries.length < transfer_quantity) {
        throw new ApiError(400, `Station ${source_station_id} does not have enough available batteries.`);
      }

      await db.Battery.update(
        { slot_id: null },
        { where: { battery_id: availableBatteries.map(b => b.battery_id) }, transaction: t }
      );

      const order = await db.TransferOrder.create({
        transfer_request_id,
        source_station_id,
        target_station_id,
        staff_id: null,
        transfer_quantity,
        status: 'incompleted',
      }, { transaction: t });

      await order.addBatteries(availableBatteries, { transaction: t });

      orders.push({
        order,
        transfer_battery_ids: availableBatteries.map(b => b.battery_id),
      });
    }

    // commit a transaction
    await t.commit();

    return orders;

  } catch (err) {
    await t.rollback();
    throw new ApiError(500, `Transfer order transaction error: ${err.message}`)
  }
}

async function rejectTransfer(user, transfer_request_id) {
  const request = await db.TransferRequest.findByPk(transfer_request_id);
  if (!request) throw new ApiError(404, 'Transfer request not found');
  if (request.status !== 'requested') throw new ApiError(400, `Cannot reject a transfer request with status '${request.status}'`);

  request.status = 'rejected';
  request.admin_id = user.account_id;
  request.resolve_time = new Date();
  await request.save();
  return request;
}

async function confirmTransfer(user, transfer_order_id) {
  const now = new Date();
  const activeShift = await db.Shift.findOne({
    where: {
      staff_id: user.account_id,
      start_time: { [db.Sequelize.Op.lte]: now },
      end_time: { [db.Sequelize.Op.gte]: now },
    },
  });
  if (!activeShift) throw new ApiError(400, "You do not have any active shift at this current time");
  
  const order = await db.TransferOrder.findByPk(transfer_order_id, {
    include: [
      {
        model: db.Battery,
        as: 'batteries'
      },
    ],
  });
  
  if (!order) throw new ApiError(400, "Transfer order not found");
  order.staff_id = user.account_id;
  order.confirm_time = now;
  order.status = 'completed';
  await order.save();

  // check all transfer completed
  const orders = await db.TransferOrder.findAll({
    where: { transfer_request_id: order.transfer_request_id },
  });

  if (orders.every(d => d.status === 'completed')) {
    const req = await db.TransferRequest.findByPk(order.transfer_request_id);
    req.status = 'completed';
    await req.save();
  }

  return order;
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

  if (transferReq.station_id != activeShift.station_id) {
    throw new ApiError(400, 'You are not currently working at this station');
  }

  if (transferReq.status !== 'requested') {
    throw new ApiError(400, `Cannot cancel a transfer request with status '${request.status}'`);
  }

  transferReq.status = 'cancelled';
  await transferReq.save();
  return transferReq;
}

module.exports = { findAll, findById, requestTransfer, approveTransfer, createTransfer, rejectTransfer, confirmTransfer, cancelTransfer };
