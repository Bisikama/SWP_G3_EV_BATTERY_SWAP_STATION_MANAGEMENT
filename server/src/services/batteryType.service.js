const { BatteryType, VehicleModel } = require('../models');

async function findAll() {
  return BatteryType.findAll();
}

async function findById(id) {
  const bt = BatteryType.findByPk(id);
  if (!bt) throw new Error('Battery type not found');
  return bt;
}

async function createBatteryType(data) {
  return BatteryType.create(data);
}

async function updateBatteryType(id, data) {
  const bt = await BatteryType.findByPk(id);
  if (!bt) throw new Error('Battery type not found');
  await bt.update(data);
  return bt;
}

async function deleteBatteryType(id) {
  const bt = await BatteryType.findByPk(id, {
    include: [{ model: VehicleModel, as: 'vehicleModels' }]
  });
  if (!bt) throw new Error('Battery type not found');

  // if (bt.vehicleModels && bt.vehicleModels.length > 0) {
  //   throw new Error('Cannot delete battery type: linked vehicle models exist');
  // }
  await bt.destroy();
  return true;
}

module.exports = { findAll, findById, createBatteryType, updateBatteryType, deleteBatteryType };
