const batteryService = require('../services/battery.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const { page, pageSize, ...filters } = req.query;
  const batteries = await batteryService.findAll(filters, page, pageSize);
  return res.status(200).json({ success: true, payload: { batteries } });
}

async function countByStationAndType(req, res) {
  const count = await batteryService.countByStationAndType(req);
  return res.status(200).json({ success: true, payload: count });
}

async function findByVehicle(req, res) {
  const { vehicle_id } = req.params;
  const batteries = await batteryService.findByVehicle(vehicle_id);
  return res.status(200).json({ success: true, payload: { batteries } });
}

async function createByVehicle(req, res) {
  const { vehicle_id } = req.params;
  const batteries = await batteryService.createByVehicle(vehicle_id);
  return res.status(201).json({ success: true, payload: { batteries } });
}

async function getBatteryAtStation(req, res) {
  const { station_id } = req.params;
  const stats = await batteryService.getBatteryStatsAtStation(station_id);
  return res.status(200).json({ success: true, payload: stats });
}

async function update(req, res) {
  const { battery_id } = req.params;
  const { current_soc, current_soh } = req.body;

  const updatedBattery = await batteryService.updateBattery(
    battery_id,
    current_soc,
    current_soh
  );

  return res.status(200).json({
    success: true,
    payload: { battery: updatedBattery },
  });
}

module.exports = {
  findAll,
  countByStationAndType,
  findByVehicle,
  createByVehicle,
  getBatteryAtStation,
  update
};
