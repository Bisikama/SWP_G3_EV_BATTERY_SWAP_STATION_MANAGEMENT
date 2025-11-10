'use strict';

const { SwapRecord, Account, Vehicle, Station, Battery, VehicleModel, BatteryType } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all swap records with optional filters
 * @param {Object} filters - { driver_id, vehicle_id, station_id, from_date, to_date }
 * @returns {Promise<Array>} - List of swap records
 */
async function getAllSwapRecords(filters = {}) {
  const where = {};
  
  if (filters.driver_id) where.driver_id = filters.driver_id;
  if (filters.vehicle_id) where.vehicle_id = filters.vehicle_id;
  if (filters.station_id) where.station_id = filters.station_id;
  
  if (filters.from_date || filters.to_date) {
    where.swap_time = {};
    if (filters.from_date) where.swap_time[Op.gte] = new Date(filters.from_date);
    if (filters.to_date) where.swap_time[Op.lte] = new Date(filters.to_date);
  }

  const swapRecords = await SwapRecord.findAll({
    where,
    include: [
      {
        model: Account,
        as: 'driver',
        attributes: ['account_id', 'email', 'fullname', 'phone_number']
      },
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['vehicle_id', 'license_plate'],
        include: [
          {
            model: VehicleModel,
            as: 'model',
            attributes: ['model_id', 'name']
          }
        ]
      },
      {
        model: Station,
        as: 'station',
        attributes: ['station_id', 'station_name', 'address']
      },
      {
        model: Battery,
        as: 'returnedBattery',
        attributes: ['battery_id', 'battery_serial', 'current_soc', 'current_soh', 'battery_type_id'],
        include: [
          {
            model: BatteryType,
            as: 'batteryType',
            attributes: ['battery_type_code','cell_chemistry']
          }
        ]
      },
      {
        model: Battery,
        as: 'retrievedBattery',
        attributes: ['battery_id', 'battery_serial', 'current_soc', 'current_soh', 'battery_type_id'],
        include: [
          {
            model: BatteryType,
            as: 'batteryType',
            attributes: ['battery_type_code','cell_chemistry']
          }
        ]
      }
    ],
    order: [['swap_time', 'DESC']]
  });

  return swapRecords;
}

/**
 * Get swap records by driver ID
 * @param {string} driver_id - Driver account ID
 * @returns {Promise<Array>} - List of swap records for the driver
 */
async function getSwapRecordsByDriver(driver_id) {
  return await getAllSwapRecords({ driver_id });
}

/**
 * Get swap records by vehicle ID
 * @param {string} vehicle_id - Vehicle ID
 * @returns {Promise<Array>} - List of swap records for the vehicle
 */
async function getSwapRecordsByVehicle(vehicle_id) {
  return await getAllSwapRecords({ vehicle_id });
}

/**
 * Get swap records by station ID
 * @param {number} station_id - Station ID
 * @returns {Promise<Array>} - List of swap records at the station
 */
async function getSwapRecordsByStation(station_id) {
  return await getAllSwapRecords({ station_id });
}

/**
 * Get swap records for a driver at a specific station
 * @param {string} driver_id - Driver account ID
 * @param {number} station_id - Station ID
 * @returns {Promise<Array>} - List of swap records
 */
async function getSwapRecordsByDriverAndStation(driver_id, station_id) {
  return await getAllSwapRecords({ driver_id, station_id });
}

/**
 * Get swap records for a vehicle at a specific station
 * @param {string} vehicle_id - Vehicle ID
 * @param {number} station_id - Station ID
 * @returns {Promise<Array>} - List of swap records
 */
async function getSwapRecordsByVehicleAndStation(vehicle_id, station_id) {
  return await getAllSwapRecords({ vehicle_id, station_id });
}

/**
 * Get a single swap record by ID
 * @param {string} swap_id - Swap record ID
 * @returns {Promise<Object|null>} - Swap record or null
 */
async function getSwapRecordById(swap_id) {
  const swapRecord = await SwapRecord.findByPk(swap_id, {
    include: [
      {
        model: Account,
        as: 'driver',
        attributes: ['account_id', 'email', 'fullname', 'phone_number']
      },
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['vehicle_id', 'license_plate'],
        include: [
          {
            model: VehicleModel,
            as: 'model',
            attributes: ['name', 'model_id']
          }
        ]
      },
      {
        model: Station,
        as: 'station',
        attributes: ['station_id', 'station_name', 'address']
      },
      {
        model: Battery,
        as: 'returnedBattery',
        attributes: ['battery_id', 'battery_serial', 'current_soc', 'current_soh', 'battery_type_id'],
        include: [
          {
            model: BatteryType,
            as: 'batteryType',
            attributes: ['cell_chemistry', 'battery_type_code']
          }
        ]
      },
      {
        model: Battery,
        as: 'retrievedBattery',
        attributes: ['battery_id', 'battery_serial', 'current_soc', 'current_soh', 'battery_type_id'],
        include: [
          {
            model: BatteryType,
            as: 'batteryType',
            attributes: ['cell_chemistry', 'battery_type_code']
          }
        ]
      }
    ]
  });

  return swapRecord;
}

/**
 * Get swap statistics
 * @param {Object} filters - { driver_id, vehicle_id, station_id, from_date, to_date }
 * @returns {Promise<Object>} - Statistics object
 */
async function getSwapStatistics(filters = {}) {
  const where = {};
  
  if (filters.driver_id) where.driver_id = filters.driver_id;
  if (filters.vehicle_id) where.vehicle_id = filters.vehicle_id;
  if (filters.station_id) where.station_id = filters.station_id;
  
  if (filters.from_date || filters.to_date) {
    where.swap_time = {};
    if (filters.from_date) where.swap_time[Op.gte] = new Date(filters.from_date);
    if (filters.to_date) where.swap_time[Op.lte] = new Date(filters.to_date);
  }

  const totalSwaps = await SwapRecord.count({ where });
  
  const swapRecords = await SwapRecord.findAll({
    where,
    attributes: ['soh_in', 'soh_out', 'swap_time']
  });

  let totalSohIn = 0;
  let totalSohOut = 0;
  let validSohInCount = 0;
  let validSohOutCount = 0;

  swapRecords.forEach(record => {
    if (record.soh_in) {
      totalSohIn += parseFloat(record.soh_in);
      validSohInCount++;
    }
    if (record.soh_out) {
      totalSohOut += parseFloat(record.soh_out);
      validSohOutCount++;
    }
  });

  const avgSohIn = validSohInCount > 0 ? (totalSohIn / validSohInCount).toFixed(2) : 0;
  const avgSohOut = validSohOutCount > 0 ? (totalSohOut / validSohOutCount).toFixed(2) : 0;

  return {
    totalSwaps,
    avgSohIn: parseFloat(avgSohIn),
    avgSohOut: parseFloat(avgSohOut),
    period: {
      from: filters.from_date || null,
      to: filters.to_date || null
    }
  };
}

module.exports = {
  getAllSwapRecords,
  getSwapRecordsByDriver,
  getSwapRecordsByVehicle,
  getSwapRecordsByStation,
  getSwapRecordsByDriverAndStation,
  getSwapRecordsByVehicleAndStation,
  getSwapRecordById,
  getSwapStatistics
};
