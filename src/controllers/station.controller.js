const stationService = require('../services/station.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const stations = await stationService.findAll();
  return res.status(200).json({ success: true, payload: { stations } });
}

async function findById(req, res) {
  const { id } = req.params;
  const station = await stationService.findById(id);
  if (!station) throw new ApiError(404, 'Station not found');
  return res.status(200).json({ success: true, payload: { station } });
}

async function create(req, res) {
  const data = req.body || {};
  const created = await stationService.createStation(data);
  return res.status(201).json({ success: true, payload: { station: created } });
}

async function update(req, res) {
  const { id } = req.params;
  const data = req.body || {};
  const updated = await stationService.updateStation(id, data);
  return res.status(200).json({ success: true, payload: { station: updated } });
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  const updated = await stationService.updateStationStatus(id, status);
  return res.status(200).json({ success: true, payload: { station: updated } });
}

module.exports = { findAll, findById, create, update, updateStatus };
