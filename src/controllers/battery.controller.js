'use strict';
const { Battery, BatteryType, CabinetSlot, Cabinet, Station, Vehicle, VehicleModel } = require('../models');

// Get all batteries
async function getAll(req, res) {
  try {
    const batteries = await Battery.findAll();
    res.json(batteries);
  } catch (err) {
    console.error('Get all batteries error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Count batteries by station name and battery type name
 * Input via query or body: stationName, batteryTypeName
 * Response: { count }
 */
async function countByStationAndType(req, res) {
  try {
    const stationName = req.query.stationName || req.body.stationName;
    const batteryTypeCode = req.query.batteryTypeCode || req.body.batteryTypeCode;

    if (!stationName || !batteryTypeCode) {
      return res.status(400).json({ message: 'stationName and batteryTypeCode are required' });
    }

    const count = await Battery.count({
      include: [
        { model: BatteryType, as: 'batteryType', where: { battery_type_code: batteryTypeCode }, required: true },
        {
          model: CabinetSlot, as: 'cabinetSlot',
          required: true,
          include: [
            { model: Cabinet, as: 'cabinet', required: true, include: [ { model: Station, as: 'station', required: true, where: { station_name: stationName } } ] }
          ]
        }
      ]
    });

    return res.json({ count });
  } catch (err) {
    console.error('Count batteries error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getByVehicle(req, res) {
  try {
    const { vehicle_id } = req.params || {};
    if (!vehicle_id) {
      return res.status(400).json({ error: 'vehicle_id is required' });
    }
    const batteries = await Battery.findAll({ where: { vehicle_id }});
    res.json(batteries);
  } catch (err) {
    console.error('Get batteries by vehicle error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createByVehicle(req, res) {
  try {
    const { vehicle_id } = req.params || {};
    if (!vehicle_id) {
      return res.status(400).json({ error: 'vehicle_id is required' });
    }

    const vehicle = await Vehicle.findByPk(vehicle_id, {
      include: [{ model: VehicleModel, as: 'model' }],
    });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const slots = vehicle.model?.battery_slot || 1;

    const batteries = await Promise.all(
      Array.from({ length: slots }, (_, index) =>
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
    res.json(batteries);
  } catch (err) {
    console.error('Create batteries by vehicle error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getAll, getByVehicle, countByStationAndType, createByVehicle };



