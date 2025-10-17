const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.VehicleModel.findAll();
}

async function findById(id) {
  return db.VehicleModel.findByPk(id);
}

async function createVehicleModel(data) {
  if (data.battery_type_id) {
    const bt = await db.BatteryType.findByPk(data.battery_type_id);
    if (!bt) throw new ApiError(400, 'Invalid battery_type_id');
  }
  return db.VehicleModel.create(data);
}

async function updateVehicleModel(id, data) {
  const vm = await db.VehicleModel.findByPk(id);
  if (!vm) throw new ApiError(404, 'Vehicle model not found');
  if (data.battery_type_id) {
    const bt = await db.BatteryType.findByPk(data.battery_type_id);
    if (!bt) throw new ApiError(400, 'Invalid battery_type_id');
  }
  await vm.update(data);
  return vm;
}

async function deleteVehicleModel(id) {
  const vm = await db.VehicleModel.findByPk(id);
  if (!vm) throw new ApiError(404, 'Vehicle model not found');
  await vm.destroy();
  return vm;
}

module.exports = { findAll, findById, createVehicleModel, updateVehicleModel, deleteVehicleModel };
