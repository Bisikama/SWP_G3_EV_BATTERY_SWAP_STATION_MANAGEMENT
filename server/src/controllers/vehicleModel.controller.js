const vehicleModelService = require('../services/vehicleModel.service');

async function findAll(req, res) {
  const models = await vehicleModelService.findAll();
  return res.status(200).json({ success: true, payload: { vehicleModels: models } });
}

async function findById(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Id is required' });
  const model = await vehicleModelService.findById(id);
  return res.status(200).json({ success: true, payload: { vehicleModel: model } });
}

async function create(req, res) {
  const data = req.body || {};
  const created = await vehicleModelService.createVehicleModel(data);
  return res.status(201).json({ success: true, payload: { vehicleModel: created } });
}

async function update(req, res) {
  const { id } = req.params;
  const data = req.body || {};
  if (!id) return res.status(400).json({ message: 'Id is required' });
  const updated = await vehicleModelService.updateVehicleModel(id, data);
  return res.status(200).json({ success: true, payload: { vehicleModel: updated } });
}

async function remove(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Id is required' });
  const deleted = await vehicleModelService.deleteVehicleModel(id);
  if (deleted) return res.status(200).json({ success: true, message: 'Vehicle model deleted successfully' });
}

module.exports = { findAll, findById, create, update, remove };
