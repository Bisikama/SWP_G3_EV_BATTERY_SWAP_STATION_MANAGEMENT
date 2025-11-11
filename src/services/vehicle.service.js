/**
 * Vehicle Service
 * 
 * Business logic layer for vehicle operations.
 * 
 * Main functions:
 *   - registerVehicle: Register new vehicle for a driver
 *   - getVehiclesByDriver: Get all vehicles owned by a driver
 *   - getVehicleByVin: Find vehicle by VIN number
 *   - getVehicleById: Find vehicle by ID
 *   - updateVehicle: Update vehicle information
 *   - deleteVehicle: Soft delete vehicle (set status to inactive)
 *   - checkVehicleOwnership: Verify if driver owns a vehicle
 *   - findVehicleWithModel: Helper to fetch vehicle with model details
 *   - getVehiclesWithoutBatteries: Get vehicles with no batteries assigned
 */

'use strict';

const { where } = require('sequelize');
const { Vehicle, VehicleModel, BatteryType, Account, Subscription, Booking, Sequelize } = require('../models');
const { Op } = Sequelize;

/**
 * Register Vehicle
 * 
 * Creates a new vehicle registration for a driver. If the VIN already exists
 * but is inactive, it will be reactivated with new owner information.
 * 
 * Validation checks:
 *   - All required fields provided
 *   - Vehicle model exists
 *   - Driver is valid and has required documents
 *   - VIN and license plate are unique (or reactivating inactive)
 * 
 * @param {string} driver_id - Driver's account ID from JWT token
 * @param {object} vehicleData - { vin, model_id, license_plate }
 * @returns {Promise<Vehicle>} Created vehicle with model details
 * @throws {Error} Validation or business logic error with status code
 */
async function registerVehicle(driver_id, { vin, model_id, license_plate }) {
  
  // Step 1: Validate required fields
  if (!vin || !model_id || !license_plate) {
    const err = new Error('VIN, model_id, and license_plate are required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedVin = vin.toUpperCase();

  // Step 2: Validate model and driver in parallel
  const [vehicleModel, driver] = await Promise.all([
    VehicleModel.findByPk(model_id),
    Account.findByPk(driver_id)
  ]);

  if (!vehicleModel) {
    const err = new Error('Vehicle model not found');
    err.statusCode = 404;
    err.field = 'model_id';
    throw err;
  }

  if (!driver || driver.role !== 'driver') {
    const err = new Error('Only drivers can register vehicles');
    err.statusCode = 403;
    throw err;
  }

  // Step 3: Check driver has required documents
  if (!driver.citizen_id || !driver.driving_license) {
    const missingFields = [];
    if (!driver.citizen_id) missingFields.push('citizen_id');
    if (!driver.driving_license) missingFields.push('driving_license');
    
    const err = new Error(`Driver must have ${missingFields.join(' and ')} to register vehicle`);
    err.statusCode = 403;
    err.missingFields = missingFields;
    throw err;
  }

  // Step 4: Check if VIN already exists
  const existingVin = await Vehicle.findOne({ 
    where: { vin: normalizedVin } 
  });
  
  if (existingVin) {
    
    // Case A: VIN is active - cannot register
    if (existingVin.status === 'active') {
      const err = new Error('VIN already registered');
      err.statusCode = 409;
      err.field = 'vin';
      throw err;
    }
    
    // Case B: VIN is inactive - reactivate with new information
    if (existingVin.status === 'inactive') {
      
      // Check license plate is not taken by another vehicle
      const duplicatePlate = await Vehicle.findOne({ 
        where: { license_plate } 
      });
      
      if (duplicatePlate) {
        const err = new Error('License plate already registered');
        err.statusCode = 409;
        err.field = 'license_plate';
        throw err;
      }

      // Update inactive vehicle with new owner and information
      existingVin.driver_id = driver_id;
      existingVin.model_id = model_id;
      existingVin.license_plate = license_plate;
      existingVin.status = 'active';
      
      await existingVin.save();

      return findVehicleWithModel(existingVin.vehicle_id);
    }
  }

  // Step 5: Create new vehicle
  
  // Check license plate uniqueness
  const existingPlate = await Vehicle.findOne({ 
    where: { license_plate } 
  });
  
  if (existingPlate) {
    const err = new Error('License plate already registered');
    err.statusCode = 409;
    err.field = 'license_plate';
    throw err;
  }

  const newVehicle = await Vehicle.create({
    driver_id,
    model_id,
    vin: normalizedVin,
    license_plate,
    status: 'active'
  });

  return findVehicleWithModel(newVehicle.vehicle_id);
}

/**
 * Get Vehicles By Driver
 * 
 * Retrieves all vehicles owned by a specific driver.
 * Supports optional status filtering.
 * 
 * @param {string} driver_id - Driver's account ID
 * @param {object} options - { status?: 'active' | 'inactive' | 'all' }
 * @returns {Promise<Vehicle[]>} Array of vehicles with model details
 * @throws {Error} If driver_id is missing
 */
async function getVehiclesByDriver(driver_id, options = {}) {
  
  if (!driver_id) {
    const err = new Error('Driver ID is required');
    err.statusCode = 400;
    throw err;
  }

  const { status = 'active' } = options;

  // Build where clause
  const where = { driver_id };
  
  // Apply status filter
  if (status === 'active') {
    where.status = 'active';
  } else if (status === 'inactive') {
    where.status = 'inactive';
  }
  // If status is 'all', no filter applied

  const vehicles = await Vehicle.findAll({
    where,
    include: [
      {
        model: VehicleModel,
        as: 'model',
        attributes: ['model_id', 'name', 'brand', 'avg_energy_usage', 'battery_slot'],
        include: [{
          model: BatteryType,
          as: 'batteryType',
          attributes: ['battery_type_id', 'battery_type_code', 'nominal_capacity']
        }]
      }
    ]
  });

  return vehicles;
}

/**
 * Get Vehicle By VIN
 * 
 * Looks up a vehicle by its VIN number.
 * Returns vehicle with model and driver information.
 * 
 * @param {string} vin - Vehicle Identification Number
 * @returns {Promise<Vehicle>} Vehicle with model and driver details
 * @throws {Error} If VIN not provided or vehicle not found
 */
async function getVehicleByVin(vin) {
  
  if (!vin) {
    const err = new Error('VIN is required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedVin = vin.toUpperCase();

  const vehicle = await Vehicle.findOne({
    where: { vin: normalizedVin },
    include: [
      {
        model: VehicleModel,
        as: 'model',
        attributes: ['model_id', 'name', 'brand', 'avg_energy_usage', 'battery_slot'],
        include: [{
          model: BatteryType,
          as: 'batteryType',
          attributes: ['battery_type_id', 'battery_type_code', 'nominal_capacity']
        }]
      },
      {
        model: Account,
        as: 'driver',
        attributes: ['account_id', 'fullname', 'email', 'phone_number']
      }
    ]
  });

  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.statusCode = 404;
    throw err;
  }

  return vehicle;
}

/**
 * Get Vehicle By ID
 * 
 * Retrieves vehicle by its unique ID.
 * Optionally includes related model information.
 * 
 * @param {string} vehicle_id - Vehicle's UUID
 * @param {boolean} includeRelations - Whether to include model details
 * @returns {Promise<Vehicle>} Vehicle information
 * @throws {Error} If vehicle_id not provided or vehicle not found
 */
async function getVehicleById(vehicle_id, includeRelations = true) {
  
  if (!vehicle_id) {
    const err = new Error('Vehicle ID is required');
    err.statusCode = 400;
    throw err;
  }

  if (includeRelations) {
    return findVehicleWithModel(vehicle_id);
  }

  const vehicle = await Vehicle.findByPk(vehicle_id);
  
  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.statusCode = 404;
    throw err;
  }

  return vehicle;
}

/**
 * Update Vehicle
 * 
 * Updates vehicle information (license plate or model).
 * Only the vehicle owner can perform updates.
 * 
 * Validation:
 *   - At least one field must be provided
 *   - Vehicle exists and belongs to driver
 *   - New values are valid and unique
 * 
 * @param {string} vehicle_id - Vehicle's UUID
 * @param {string} driver_id - Driver's account ID (for ownership check)
 * @param {object} updates - { license_plate?, model_id? }
 * @returns {Promise<Vehicle>} Updated vehicle with model details
 * @throws {Error} Validation or authorization error with status code
 */
async function updateVehicle(vehicle_id, driver_id, updates) {
  
  const { license_plate, model_id } = updates;

  // Validate at least one field to update
  if (!license_plate && !model_id) {
    const err = new Error('At least one field (license_plate or model_id) is required to update');
    err.statusCode = 400;
    throw err;
  }

  // Find vehicle
  const vehicle = await Vehicle.findByPk(vehicle_id);
  
  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.statusCode = 404;
    throw err;
  }

  // Check ownership
  if (vehicle.driver_id !== driver_id) {
    const err = new Error('You can only update your own vehicles');
    err.statusCode = 403;
    throw err;
  }

  // Update license plate if provided and different
  if (license_plate && license_plate !== vehicle.license_plate) {
    
    const existingPlate = await Vehicle.findOne({ 
      where: { license_plate } 
    });
    
    if (existingPlate) {
      const err = new Error('License plate already exists');
      err.statusCode = 409;
      err.field = 'license_plate';
      throw err;
    }
    
    vehicle.license_plate = license_plate;
  }

  // Update model if provided and different
  if (model_id && model_id !== vehicle.model_id) {
    
    const vehicleModel = await VehicleModel.findByPk(model_id);
    
    if (!vehicleModel) {
      const err = new Error('Vehicle model not found');
      err.statusCode = 404;
      err.field = 'model_id';
      throw err;
    }
    
    vehicle.model_id = model_id;
  }

  await vehicle.save();

  return findVehicleWithModel(vehicle_id);
}

/**
 * Delete Vehicle
 * 
 * Soft deletes a vehicle by setting status to 'inactive'.
 * Cannot delete if vehicle has active subscriptions or pending bookings.
 * 
 * Pre-conditions:
 *   - Vehicle must belong to driver
 *   - No active subscriptions
 *   - No pending bookings
 * 
 * @param {string} vehicle_id - Vehicle's UUID
 * @param {string} driver_id - Driver's account ID (for ownership check)
 * @returns {Promise<object>} Basic info of deactivated vehicle
 * @throws {Error} Validation, authorization, or business rule error
 */
async function deleteVehicle(vehicle_id, driver_id) {
  
  // Find vehicle
  const vehicle = await Vehicle.findByPk(vehicle_id);
  
  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.statusCode = 404;
    throw err;
  }

  // Check ownership
  if (vehicle.driver_id !== driver_id) {
    const err = new Error('You can only delete your own vehicles');
    err.statusCode = 403;
    throw err;
  }

  // Check if already inactive
  if (vehicle.status === 'inactive') {
    const err = new Error('Vehicle is already deactivated');
    err.statusCode = 400;
    throw err;
  }

  // Check for active subscriptions and pending bookings in parallel
  const [activeSubscription, pendingBooking] = await Promise.all([
    Subscription.findOne({
      where: {
        vehicle_id,
        status: 'active',
        end_date: {
          [Op.gte]: new Date()
        }
      }
    }),
    Booking.findOne({
      where: {
        vehicle_id,
        status: 'pending'
      }
    })
  ]);

  if (activeSubscription) {
    const err = new Error('Cannot deactivate vehicle. Active subscription exists. Please cancel subscription first');
    err.statusCode = 409;
    throw err;
  }

  if (pendingBooking) {
    const err = new Error('Cannot deactivate vehicle. Pending bookings exist. Please cancel bookings first');
    err.statusCode = 409;
    throw err;
  }

  // Soft delete by setting status to inactive
  vehicle.status = 'inactive';
  await vehicle.save();

  return {
    vehicle_id: vehicle.vehicle_id,
    vin: vehicle.vin,
    license_plate: vehicle.license_plate,
    status: vehicle.status
  };
}

/**
 * Check Vehicle Ownership
 * 
 * Verifies if a vehicle belongs to a specific driver.
 * 
 * @param {string} vehicle_id - Vehicle's UUID
 * @param {string} driver_id - Driver's account ID
 * @returns {Promise<boolean>} True if driver owns the vehicle
 */
async function checkVehicleOwnership(vehicle_id, driver_id) {
  
  const vehicle = await Vehicle.findByPk(vehicle_id);
  
  if (!vehicle) {
    return false;
  }

  return vehicle.driver_id === driver_id;
}

/**
 * Find Vehicle With Model
 * 
 * Helper function to fetch vehicle with full model and battery type details.
 * Used internally by other service functions.
 * 
 * @param {string} vehicle_id - Vehicle's UUID
 * @returns {Promise<Vehicle>} Vehicle with model and battery type info
 * @throws {Error} If vehicle not found
 */
async function findVehicleWithModel(vehicle_id) {
  
  const vehicle = await Vehicle.findByPk(vehicle_id,    
    {
    where: { status: 'active' },
    include: [
      {
        model: VehicleModel,
        as: 'model',
        attributes: ['model_id', 'name', 'brand', 'avg_energy_usage', 'battery_slot', 'battery_type_id'],
        include: [{
          model: BatteryType,
          as: 'batteryType',
          attributes: ['battery_type_id', 'battery_type_code', 'nominal_capacity']
        }]
      }
    ]
  });

  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.statusCode = 404;
    throw err;
  }

  return vehicle;
}

/**
 * Get Vehicles Without Batteries
 * 
 * Returns list of vehicles that don't have any batteries assigned.
 * Returns only vehicle_id and account_id pairs.
 * 
 * @returns {Promise<Array<{vehicle_id: string, account_id: string}>>} Vehicle IDs without batteries
 */
async function getVehiclesWithoutBatteries() {
  
  const { Battery } = require('../models');

  const vehicles = await Vehicle.findAll({
    attributes: ['vehicle_id', 'driver_id'],
    include: [
      {
        model: Battery,
        as: 'batteries',
        attributes: ['battery_id'],
        required: false
      }
    ]
  });

  // Filter vehicles with no batteries and map to required format
  const vehiclesWithoutBattery = vehicles
    .filter(vehicle => !vehicle.batteries || vehicle.batteries.length === 0)
    .map(vehicle => ({
      vehicle_id: vehicle.vehicle_id,
      account_id: vehicle.driver_id
    }));

  return vehiclesWithoutBattery;
}

module.exports = {
  registerVehicle,
  getVehiclesByDriver,
  getVehicleByVin,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  checkVehicleOwnership,
  findVehicleWithModel,
  getVehiclesWithoutBatteries
};
