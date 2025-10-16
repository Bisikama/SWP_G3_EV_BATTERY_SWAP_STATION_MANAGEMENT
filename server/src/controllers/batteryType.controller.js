const batteryTypeService = require('../services/batteryType.service');

async function findAll(req, res) {
  const types = await batteryTypeService.findAll();
  return res.status(200).json({ success: true, payload: { batteryTypes: types } });
}

async function findById(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Id is required' });
  const type = await batteryTypeService.findById(id);
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
  if (!id) return res.status(400).json({ message: 'Id is required' });
  const updated = await batteryTypeService.updateBatteryType(id, data);
  return res.status(200).json({ success: true, payload: { batteryType: updated } });
}

async function remove(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Id is required' });
  const deleted = await batteryTypeService.deleteBatteryType(id);
  if (deleted) return res.status(200).json({ success: true, message: 'Battery type deleted successfully' });
}

module.exports = { findAll, findById, create, update, remove };
