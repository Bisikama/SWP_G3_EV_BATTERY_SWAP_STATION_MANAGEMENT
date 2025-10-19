'use strict';
const { Battery, BatteryType, CabinetSlot, Cabinet, Station } = require('../models');

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

module.exports = { getAll, countByStationAndType };



