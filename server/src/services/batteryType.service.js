const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.BatteryType.findAll();
}

async function findById(id) {
  return db.BatteryType.findByPk(id);
}

async function createBatteryType(data) {
  return db.BatteryType.create(data);
}

async function updateBatteryType(id, data) {
  const bt = await db.BatteryType.findByPk(id);
  if (!bt) throw new ApiError(404, 'Battery type not found');
  await bt.update(data);
  return bt;
}

async function deleteBatteryType(id) {
  const bt = await db.BatteryType.findByPk(id, {
    include: [{ model: db.VehicleModel, as: 'vehicleModels' }]
  });
  if (!bt) {
    throw new ApiError(404, 'Battery type not found');
  }
  if (bt.vehicleModels?.length > 0) {
    throw new ApiError(409, 'Cannot delete battery type because linked vehicle models exist');
  }
  await bt.destroy();
  return bt;
}

module.exports = { findAll, findById, createBatteryType, updateBatteryType, deleteBatteryType };
