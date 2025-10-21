const vehicleModelService = require('../services/vehicleModel.service');

async function findAll(req, res) {
  const models = await vehicleModelService.findAll();
  return res.status(200).json({ success: true, payload: { vehicleModels: models } });
}

async function findById(req, res) {
  const { id } = req.params;
  const model = await vehicleModelService.findById(id);
  if (!model) throw new ApiError(404, 'Vehicle model not found');
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
  const updated = await vehicleModelService.updateVehicleModel(id, data);
  return res.status(200).json({ success: true, payload: { vehicleModel: updated } });
}

async function remove(req, res) {
  const { id } = req.params;
  await vehicleModelService.deleteVehicleModel(id);
  return res.status(200).json({ success: true });
}

module.exports = { findAll, findById, create, update, remove };
