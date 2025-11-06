'use strict';
const { Battery, BatteryType, CabinetSlot, Cabinet, Station, Vehicle, VehicleModel } = require('../models');
const swapBatteryService = require('../services/swap_battery.service');
const { Op } = require('sequelize');
// Get all batteries
async function getAll(req, res) {
  try {
    const batteries = await Battery.findAll();
    const count = batteries ? batteries.length : 0;
    res.json({
      message: `Tổng số pin: ${count}`,
      batteries
      
    });
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

    // Thêm validation
    if (await Battery.count({ where: { vehicle_id } }) > 0) {
  return res.status(409).json({ 
    error: 'Vehicle already has batteries' 
  });
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

/**
 * Get battery statistics at a specific station
 * @param {string} station_id - Station ID
 * @returns {Object} - Battery statistics
 */
async function getBatteryAtStation(req, res) {
  try {
    const { station_id } = req.params;
   
    const station = await Station.findByPk(station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Query all batteries at the station
    const batteries = await CabinetSlot.findAll({
          where: {
            status: {
              [Op.in]: ['occupied']
            }
          },
          include: [
            {
              model: Cabinet,
              as: 'cabinet',
              where: { station_id: station_id },
              attributes: ['cabinet_id', 'station_id']
            },
          ],
        });

		// Query all batteries at the station
    const shortageBatteries = await CabinetSlot.findAll({
          where: {
            status: {
              [Op.in]: ['empty']
            }
          },
          include: [
            {
              model: Cabinet,
              as: 'cabinet',
              where: { station_id: station_id },
              attributes: ['cabinet_id', 'station_id']
            },
          ],
        });

    // Query available batteries for swap
    const availableBatteries = await swapBatteryService.getAvailableBatteriesForSwapAtStation(station_id);
		const defaultEmptySlotsCount = 3;

    const totalCount = batteries ? batteries.length : 0;
    const availableCount = availableBatteries ? availableBatteries.length : 0;
		const shortageCount = shortageBatteries.length > defaultEmptySlotsCount ? shortageBatteries.length - defaultEmptySlotsCount : 0;

    return res.json({
      success: true,
      data: {
        TotalBatteries: totalCount,
        AvailableForSwap: availableCount,
				BatteryShortage: shortageCount,
        message: `Total batteries at station ${station_id}: ${totalCount}, Available for swap: ${availableCount}`
      }
    });
  } catch (err) {
    console.error('Get battery stats at station error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: err.message 
    });
  }
}


module.exports = { getAll, getByVehicle, countByStationAndType, createByVehicle, getBatteryAtStation };



