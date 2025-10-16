// src/controllers/vehicle.controller.js
'use strict';
const { Vehicle, VehicleModel, Account } = require('../models');

/**
 * Register a new vehicle for the authenticated driver
 * POST /api/user/vehicle/register
 * Body: { vin: string, model_id: number, license_plate: string }
 */
async function registerVehicle(req, res) {
  try {
    const { vin, model_id, license_plate } = req.body;
    const driver_id = req.user.account_id; // From verifyToken middleware

    // Validate required fields
    if (!vin) {
      return res.status(400).json({ message: 'VIN is required' });
    }

    if (!model_id) {
      return res.status(400).json({ message: 'Vehicle model_id is required' });
    }

    if (!license_plate) {
      return res.status(400).json({ message: 'License plate is required' });
    }

    // Check if VIN already exists
    const existingVehicleByVin = await Vehicle.findOne({ where: { vin } });
    if (existingVehicleByVin) {
      return res.status(409).json({ 
        message: 'VIN already registered',
        vin: vin
      });
    }

    // Check if license plate already exists
    const existingVehicleByPlate = await Vehicle.findOne({ where: { license_plate } });
    if (existingVehicleByPlate) {
      return res.status(409).json({ 
        message: 'License plate already registered',
        license_plate: license_plate
      });
    }

    // Verify vehicle model exists
    const vehicleModel = await VehicleModel.findByPk(model_id);
    if (!vehicleModel) {
      return res.status(404).json({ 
        message: 'Vehicle model not found',
        model_id: model_id
      });
    }

    // Verify driver exists and has correct permission
    const driver = await Account.findByPk(driver_id);
    if (!driver || driver.permission !== 'driver') {
      return res.status(403).json({ 
        message: 'Only drivers can register vehicles'
      });
    }

    // Create vehicle
    const newVehicle = await Vehicle.create({
      driver_id,
      model_id,
      vin,
      license_plate
    });

    // Return success with vehicle details
    const vehicleWithModel = await Vehicle.findByPk(newVehicle.vehicle_id, {
      include: [
        { 
          model: VehicleModel, 
          as: 'model',
          attributes: ['model_id', 'name', 'brand', 'avg_energy_usage']
        }
      ]
    });

    return res.status(201).json({
      message: 'Vehicle registered successfully',
      vehicle: vehicleWithModel
    });

  } catch (error) {
    console.error('Register vehicle error:', error);
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return res.status(409).json({ 
        message: `${field} already exists`,
        field: field
      });
    }

    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all vehicles of the authenticated driver
 * GET /api/user/vehicle/my-vehicles
 */
async function getMyVehicles(req, res) {
  try {
    const driver_id = req.user.account_id;

    const vehicles = await Vehicle.findAll({
      where: { driver_id },
      include: [
        { 
          model: VehicleModel, 
          as: 'model',
          attributes: ['model_id', 'name', 'brand', 'avg_energy_usage']
        }
      ]
    });

    return res.status(200).json({
      message: 'Vehicles retrieved successfully',
      count: vehicles.length,
      vehicles
    });

  } catch (error) {
    console.error('Get my vehicles error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get vehicle by VIN
 * GET /api/user/vehicle/:vin
 */
async function getVehicleByVin(req, res) {
  try {
    const { vin } = req.params;

    const vehicle = await Vehicle.findOne({
      where: { vin: vin.toUpperCase() },
      include: [
        { 
          model: VehicleModel, 
          as: 'model',
          attributes: ['model_id', 'name', 'brand', 'avg_energy_usage']
        },
        {
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'fullname', 'email', 'phone_number']
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.status(200).json({
      message: 'Vehicle found',
      vehicle
    });

  } catch (error) {
    console.error('Get vehicle by VIN error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  registerVehicle,
  getMyVehicles,
  getVehicleByVin
};
