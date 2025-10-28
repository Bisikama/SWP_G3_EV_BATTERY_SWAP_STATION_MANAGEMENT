const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.Station.findAll();
}

async function findById(id) {
  return db.Station.findByPk(id, {
    include: [
      { model: db.Cabinet, as: 'cabinets' }
    ]
  });
}

async function createStation(data) {
  return db.Station.create(data);
}

async function updateStation(id, data) {
  const station = await db.Station.findByPk(id);
  if (!station) throw new ApiError(404, 'Station not found');
  delete data.status;
  await station.update(data);
  return station;
}

async function updateStationStatus(id, status) {
  const station = await db.Station.findByPk(id);
  if (!station) throw new ApiError(404, 'Station not found');
  await station.update({ status });
  return station;
}

module.exports = { findAll, findById, createStation, updateStation, updateStationStatus };
