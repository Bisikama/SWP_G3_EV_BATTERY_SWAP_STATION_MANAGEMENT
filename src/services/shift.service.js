const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.Shift.findAll();
}

async function findById(id) {
  return db.Shift.findByPk(id);
}

async function findByStaff(staff_id) {
  return db.Shift.findAll({
    where: {
      staff_id
    }
  });
}

async function createShift(user, data) {
	data.admin_id = user.account_id;
  const staff = await db.Account.findByPk(data.staff_id);
	if (!staff) throw new ApiError(400, 'Staff not found');
  const station = await db.Station.findByPk(data.station_id);
  if (!station) throw new ApiError(400, 'Station not found');

	const scheduledStartTime = new Date(data.start_time);
  const scheduledEndTime = new Date(data.end_time);

  // Check conflict
  const stationConflict = await findConflictedShift({ station_id: data.station_id }, scheduledStartTime, scheduledEndTime);
  if (stationConflict) {
    throw new ApiError(400, 'This station already has a shift during this time range');
  }
  const staffConflict = await findConflictedShift({ staff_id: data.staff_id }, scheduledStartTime, scheduledEndTime);
  if (staffConflict) {
    throw new ApiError(400, 'This staff already has a shift during this time range');
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

  const staff_id = data.staff_id || shift.staff_id;
  const station_id = data.station_id || shift.station_id;
	const scheduledStartTime = new Date(data.start_time || shift.start_time);
  const scheduledEndTime = new Date(data.end_time || shift.end_time);
  // Check if staff already has a shift in the same time range
  const stationConflict = await findConflictedShift({ station_id }, scheduledStartTime, scheduledEndTime, shift.shift_id);
	if (stationConflict) {
    throw new ApiError(400, 'This station already has a shift during this time range');
  }
  const staffConflict = await findConflictedShift({ staff_id }, scheduledStartTime, scheduledEndTime, shift.shift_id);
	if (staffConflict) {
    throw new ApiError(400, 'This staff already has a shift during this time range');
  }

  await shift.update(data);
  return shift;
}

async function findConflictedShift(condition, scheduled_start_time, scheduled_end_time, exclude_id = null) {
  const where = {
    ...condition,
    [db.Sequelize.Op.or]: [
      {
        start_time: { [db.Sequelize.Op.between]: [scheduled_start_time, scheduled_end_time] }
      },
      {
        end_time: { [db.Sequelize.Op.between]: [scheduled_start_time, scheduled_end_time] }
      },
      {
        start_time: { [db.Sequelize.Op.lte]: scheduled_start_time },
        end_time: { [db.Sequelize.Op.gte]: scheduled_end_time }
      }
    ]
  };

  if (exclude_id) {
    where.shift_id = { [db.Sequelize.Op.ne]: exclude_id };
  }

  return db.Shift.findOne({ where });
}

async function removeShift(user, id) {
  const shift = await db.Shift.findByPk(id);
  if (!shift) throw new ApiError(404, 'Shift not found');

  if (shift.admin_id !== user.account_id) {
    throw new ApiError(403, 'Access denied: You can only remove shifts that you created');
  }

  const now = new Date();
  if (now >= shift.start_time && now <= shift.end_time) {
    throw new ApiError(400, 'Cannot delete a shift that is currently in progress');
  }

  await shift.destroy();
  return shift;
}

module.exports = { findAll, findById, findByStaff, createShift, updateShift, removeShift };
