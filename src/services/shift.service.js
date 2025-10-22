const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.Shift.findAll();
}

async function findById(id) {
  return db.Shift.findByPk(id);
}

async function createShift(user, data) {
	data.admin_id = user.account_id;
	delete data.status;
  const staff = await db.Account.findByPk(data.staff_id);
	if (!staff) throw new ApiError(400, 'Staff not found');
  const station = await db.Station.findByPk(data.station_id);
  if (!station) throw new ApiError(400, 'Station not found');

	const scheduledStartTime = new Date(data.start_time);
  const scheduledEndTime = new Date(data.end_time);
  // Check if staff already has a shift in the same time range
  const overlappingShift = await db.Shift.findOne({
    where: {
      station_id: data.station_id,
      status: { [db.Sequelize.Op.ne]: 'cancelled' }, // ignore cancelled shifts
      [db.Sequelize.Op.or]: [
        {
          start_time: { [db.Sequelize.Op.between]: [scheduledStartTime, scheduledEndTime] }
        },
        {
          end_time: { [db.Sequelize.Op.between]: [scheduledStartTime, scheduledEndTime] }
        },
        {
          start_time: { [db.Sequelize.Op.lte]: scheduledStartTime },
          end_time: { [db.Sequelize.Op.gte]: scheduledEndTime }
        }
      ]
    }
  });
  console.log('overlappingShift:', overlappingShift);
	if (overlappingShift) {
    throw new ApiError(400, 'Shift has already been taken in this time range at this station');
  }

  return db.Shift.create(data);
}

async function updateShift(user, id, data) {
  const shift = await db.Shift.findByPk(id);
  if (!shift) throw new ApiError(404, 'Shift not found');
	if (shift.admin_id !== user.account_id) {
    throw new ApiError(403, 'Access denied: You can only update shifts that you created');
  }
	if (data.staff_id) {
    const staff = await db.Account.findByPk(data.staff_id);
    if (!staff) throw new ApiError(400, 'Staff not found');
  }
  if (data.station_id) {
    const station = await db.Station.findByPk(data.station_id);
    if (!station) throw new ApiError(400, 'Station not found');
  }

	const scheduledStartTime = new Date(data.start_time);
  const scheduledEndTime = new Date(data.end_time);
  // Check if staff already has a shift in the same time range
  const overlappingShift = await db.Shift.findOne({
    where: {
      station_id: data.station_id,
      status: { [db.Sequelize.Op.ne]: 'cancelled' }, // ignore cancelled shifts
      [db.Sequelize.Op.or]: [
        {
          start_time: { [db.Sequelize.Op.between]: [scheduledStartTime, scheduledEndTime] }
        },
        {
          end_time: { [db.Sequelize.Op.between]: [scheduledStartTime, scheduledEndTime] }
        },
        {
          start_time: { [db.Sequelize.Op.lte]: scheduledStartTime },
          end_time: { [db.Sequelize.Op.gte]: scheduledEndTime }
        }
      ]
    }
  });
	if (overlappingShift) {
    throw new ApiError(400, 'Shift has already been taken in this time range at this station');
  }

	delete data.status;
  await shift.update(data);
  return shift;
}

async function cancelShift(user, id) {
	const shift = await db.Shift.findByPk(id);
	if (!shift) throw new ApiError(404, 'Shift not found');
	if (shift.admin_id !== user.account_id) {
    throw new ApiError(403, 'Access denied: You can only cancel shifts that you created');
  }
	const now = new Date();
  if (shift.start_time <= now) {
    throw new ApiError(400, 'Cannot cancel a shift that has already started');
  }
	if (shift.status === 'cancelled') {
    throw new ApiError(400, 'Shift is already cancelled');
  }
  if (shift.status === 'confirmed') {
    throw new ApiError(400, 'Cannot cancel a shift that is already confirmed');
  }
	shift.status = 'cancelled';
	await shift.save();
	return shift;
}

async function confirmShift(user, id) {
  const shift = await db.Shift.findByPk(id);
  if (!shift) throw new ApiError(404, 'Shift not found');
	if (shift.staff_id !== user.account_id) {
    throw new ApiError(403, 'Access denied: You can only confirm shifts that you are assigned to');
  }
	const now = new Date();
  const start = new Date(shift.start_time);
  const end = new Date(shift.end_time);
  if (now < start || now > end) {
    throw new ApiError(400, 'Shift can only be confirmed during its scheduled time');
  }
  if (shift.status === 'confirmed') {
    throw new ApiError(400, 'Shift is already confirmed');
  }
  if (shift.status === 'cancelled') {
    throw new ApiError(400, 'Cannot confirm a shift that has been cancelled');
  }
	shift.status = 'confirmed';
  await shift.save();
  return shift;
}

module.exports = { findAll, findById, createShift, updateShift, cancelShift, confirmShift };
