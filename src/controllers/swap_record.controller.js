'use strict';

const swapRecordService = require('../services/swap_record.service');

/**
 * Get all swap records with optional filters
 * Query params: driver_id, vehicle_id, station_id, from_date, to_date
 */
async function getAllSwapRecords(req, res) {
  try {
    const filters = {
      driver_id: req.query.driver_id,
      vehicle_id: req.query.vehicle_id,
      station_id: req.query.station_id,
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };

    const swapRecords = await swapRecordService.getAllSwapRecords(filters);

    return res.json({
      success: true,
      count: swapRecords.length,
      data: swapRecords
    });
  } catch (error) {
    console.error('Get all swap records error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get swap records by driver ID
 * Path param: driver_id
 * Query params: from_date, to_date
 */
async function getSwapRecordsByDriver(req, res) {
  try {
    const { driver_id } = req.params;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: 'driver_id is required'
      });
    }

    const swapRecords = await swapRecordService.getSwapRecordsByDriver(driver_id);

    return res.json({
      success: true,
      count: swapRecords.length,
      data: swapRecords
    });
  } catch (error) {
    console.error('Get swap records by driver error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get swap records by vehicle ID
 * Path param: vehicle_id
 */
async function getSwapRecordsByVehicle(req, res) {
  try {
    const { vehicle_id } = req.params;

    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id is required'
      });
    }

    const swapRecords = await swapRecordService.getSwapRecordsByVehicle(vehicle_id);

    return res.json({
      success: true,
      count: swapRecords.length,
      data: swapRecords
    });
  } catch (error) {
    console.error('Get swap records by vehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get swap records by station ID
 * Path param: station_id
 */
async function getSwapRecordsByStation(req, res) {
  try {
    const { station_id } = req.params;

    if (!station_id) {
      return res.status(400).json({
        success: false,
        message: 'station_id is required'
      });
    }

    const swapRecords = await swapRecordService.getSwapRecordsByStation(parseInt(station_id));

    return res.json({
      success: true,
      count: swapRecords.length,
      data: swapRecords
    });
  } catch (error) {
    console.error('Get swap records by station error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get swap records by driver and station
 * Path params: driver_id, station_id
 */
async function getSwapRecordsByDriverAndStation(req, res) {
  try {
    const { driver_id, station_id } = req.params;

    if (!driver_id || !station_id) {
      return res.status(400).json({
        success: false,
        message: 'driver_id and station_id are required'
      });
    }

    const swapRecords = await swapRecordService.getSwapRecordsByDriverAndStation(
      driver_id,
      parseInt(station_id)
    );

    return res.json({
      success: true,
      count: swapRecords.length,
      data: swapRecords
    });
  } catch (error) {
    console.error('Get swap records by driver and station error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get swap records by vehicle and station
 * Path params: vehicle_id, station_id
 */
async function getSwapRecordsByVehicleAndStation(req, res) {
  try {
    const { vehicle_id, station_id } = req.params;

    if (!vehicle_id || !station_id) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id and station_id are required'
      });
    }

    const swapRecords = await swapRecordService.getSwapRecordsByVehicleAndStation(
      vehicle_id,
      parseInt(station_id)
    );

    return res.json({
      success: true,
      count: swapRecords.length,
      data: swapRecords
    });
  } catch (error) {
    console.error('Get swap records by vehicle and station error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get a single swap record by ID
 * Path param: swap_id
 */
async function getSwapRecordById(req, res) {
  try {
    const { swap_id } = req.params;

    if (!swap_id) {
      return res.status(400).json({
        success: false,
        message: 'swap_id is required'
      });
    }

    const swapRecord = await swapRecordService.getSwapRecordById(swap_id);

    if (!swapRecord) {
      return res.status(404).json({
        success: false,
        message: 'Swap record not found'
      });
    }

    return res.json({
      success: true,
      data: swapRecord
    });
  } catch (error) {
    console.error('Get swap record by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get swap statistics
 * Query params: driver_id, vehicle_id, station_id, from_date, to_date
 */
async function getSwapStatistics(req, res) {
  try {
    const filters = {
      driver_id: req.query.driver_id,
      vehicle_id: req.query.vehicle_id,
      station_id: req.query.station_id,
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };

    const statistics = await swapRecordService.getSwapStatistics(filters);

    return res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get swap statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
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
