'use strict';
const db = require('../models');
const { Battery, BatteryType, CabinetSlot, Cabinet, Station, Vehicle, VehicleModel } = db;
const swapBatteryService = require('./swap_battery.service');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/paginate');

async function findAll(filters = {}, page = 1, pageSize = 10) {
  const options = {
    include: [
      { model: BatteryType, as: 'batteryType' },
      { model: Vehicle, as: 'vehicle', include: [{ model: VehicleModel, as: 'model' }] },
      { model: CabinetSlot, as: 'cabinetSlot', include: [{ model: Cabinet, as: 'cabinet', include: [{ model: Station, as: 'station' }] }] }
    ],
    order: [['battery_id', 'ASC']]
  };

  return paginate(Battery, filters, { ...options, page, pageSize });
}

async function countByStationAndType(req) {
  const stationName = req.query.stationName || req.body.stationName;
  const batteryTypeCode = req.query.batteryTypeCode || req.body.batteryTypeCode;

  if (!stationName || !batteryTypeCode) {
    throw new ApiError(400, 'stationName and batteryTypeCode are required');
  }

  const count = await Battery.count({
    include: [
      { model: BatteryType, as: 'batteryType', where: { battery_type_code: batteryTypeCode }, required: true },
      {
        model: CabinetSlot,
        as: 'cabinetSlot',
        required: true,
        include: [
          {
            model: Cabinet,
            as: 'cabinet',
            required: true,
            include: [{ model: Station, as: 'station', required: true, where: { station_name: stationName } }]
          }
        ]
      }
    ]
  });

  return { count };
}

async function findByVehicle(vehicle_id) {
  if (!vehicle_id) throw new ApiError(400, 'vehicle_id is required');
  return Battery.findAll({ where: { vehicle_id } });
}

async function createByVehicle(vehicle_id) {
  if (!vehicle_id) throw new ApiError(400, 'vehicle_id is required');

  const existing = await Battery.count({ where: { vehicle_id } });
  if (existing > 0) throw new ApiError(409, 'Vehicle already has batteries');

  const vehicle = await Vehicle.findByPk(vehicle_id, { include: [{ model: VehicleModel, as: 'model' }] });
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');

  const slots = vehicle.model?.battery_slot || 1;

  const batteries = await Promise.all(
    Array.from({ length: slots }, () =>
      Battery.create({
        vehicle_id,
        battery_type_id: vehicle.model?.battery_type_id,
        slot_id: null,
        battery_serial: `BAT-VEH-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        current_soc: 100.0,
        current_soh: 100.0,
      })
    )
  );

  return batteries;
}

async function getBatteryStatsAtStation(station_id) {
  const station = await Station.findByPk(station_id);
  if (!station) throw new ApiError(404, 'Station not found');

  const occupiedSlots = await CabinetSlot.findAll({
    where: { status: { [Op.in]: ['occupied'] } },
    include: [{ model: Cabinet, as: 'cabinet', where: { station_id }, attributes: ['cabinet_id', 'station_id'] }]
  });

  const emptySlots = await CabinetSlot.findAll({
    where: { status: { [Op.in]: ['empty'] } },
    include: [{ model: Cabinet, as: 'cabinet', where: { station_id }, attributes: ['cabinet_id', 'station_id'] }]
  });

  const availableBatteries = await swapBatteryService.getAvailableBatteriesForSwapAtStation(station_id);
  const defaultEmptySlotsCount = 3;

  const totalCount = occupiedSlots.length;
  const availableCount = availableBatteries.length;
  const shortageCount = emptySlots.length > defaultEmptySlotsCount
    ? emptySlots.length - defaultEmptySlotsCount
    : 0;

  return {
    TotalBatteries: totalCount,
    AvailableForSwap: availableCount,
    BatteryShortage: shortageCount,
    message: `Total batteries at station ${station_id}: ${totalCount}, Available for swap: ${availableCount}`
  };
}

async function updateBattery(battery_id, soc, soh) {
  const battery = await Battery.findByPk(battery_id);
  if (!battery) throw new ApiError(404, 'Battery not found');

  if (soc < 0 || soc > 100) throw new ApiError(400, 'Invalid SOC value');
  if (soh < 0 || soh > 100) throw new ApiError(400, 'Invalid SOH value');

  await battery.update({
    current_soc: soc,
    current_soh: soh,
  });

  return battery;
}

module.exports = {
  findAll,
  countByStationAndType,
  findByVehicle,
  createByVehicle,
  getBatteryStatsAtStation,
  updateBattery
};
