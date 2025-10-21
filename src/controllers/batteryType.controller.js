const batteryTypeService = require('../services/batteryType.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const types = await batteryTypeService.findAll();
  return res.status(200).json({ success: true, payload: { batteryTypes: types } });
}

async function findById(req, res) {
  const { id } = req.params;
  const type = await batteryTypeService.findById(id);
  if (!type) throw new ApiError(404, 'Battery type not found');
  return res.status(200).json({ success: true, payload: { batteryType: type } });
}

async function create(req, res) {
  const data = req.body || {};
  const created = await batteryTypeService.createBatteryType(data);
  return res.status(201).json({ success: true, payload: { batteryType: created } });
}

async function update(req, res) {
  const { id } = req.params;
  const data = req.body || {};
  const updated = await batteryTypeService.updateBatteryType(id, data);
  return res.status(200).json({ success: true, payload: { batteryType: updated } });
}

async function remove(req, res) {
  const { id } = req.params;
  await batteryTypeService.deleteBatteryType(id);
  return res.status(200).json({ success: true });
}

module.exports = { findAll, findById, create, update, remove };
