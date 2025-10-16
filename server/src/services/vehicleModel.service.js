const { BatteryType, VehicleModel } = require('../models');

async function findAll() {
  return VehicleModel.findAll();
}

async function findById(id) {
  const vm = BatteryType.findByPk(id);
  if (!vm) throw new Error('Vehicle model not found');
  return vm;
}

async function createVehicleModel(data) {
  if (data.battery_type_id) {
    const batteryType = await BatteryType.findByPk(data.battery_type_id);
    if (!batteryType) {
      throw new Error('Invalid battery_type_id: battery type not found');
    }
  }
  return VehicleModel.create(data);
}

async function updateVehicleModel(id, data) {
  const vm = await VehicleModel.findByPk(id);
  if (!vm) throw new Error('Vehicle model not found');
  if (data.battery_type_id) {
    const batteryType = await BatteryType.findByPk(data.battery_type_id);
    if (!batteryType) {
      throw new Error('Invalid battery_type_id: battery type not found');
    }
  }
  await vm.update(data);
  return vm;
}

async function deleteVehicleModel(id) {
  const vm = await VehicleModel.findByPk(id);
  if (!vm) throw new Error('Vehicle model not found');
  await vm.destroy();
  return true;
}

module.exports = { findAll, findById, createVehicleModel, updateVehicleModel, deleteVehicleModel };
