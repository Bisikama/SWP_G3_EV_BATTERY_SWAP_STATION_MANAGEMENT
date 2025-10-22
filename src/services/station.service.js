const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.Station.findAll();
}

async function findById(id) {
  return db.Station.findByPk(id);
}

async function createStation(data) {
  return db.Station.create(data);
}

async function updateStation(id, data) {
  const station = await db.Station.findByPk(id);
  if (!station) throw new ApiError(404, 'Station not found');
  await station.update(data);
  return station;
}

async function deleteStation(id) {
  const station = await db.Station.findByPk(id, {
    include: [
      { model: db.Cabinet, as: 'cabinets' },
      { model: db.Shift, as: 'shifts' },
      { model: db.Booking, as: 'bookings' }
    ]
  });
  if (!station) throw new ApiError(404, 'Station not found');
  if (station.cabinets && station.cabinets.length > 0) {
		throw new ApiError(409, 'Cannot delete station: linked cabinets exist');
	}
	if (station.shifts && station.shifts.length > 0) {
		throw new ApiError(409, 'Cannot delete station: linked shifts exist');
	}
	if (station.bookings && station.bookings.length > 0) {
		throw new ApiError(409, 'Cannot delete station: linked bookings exist');
	}
  await station.destroy();
  return station;
}

module.exports = { findAll, findById, createStation, updateStation, deleteStation };
