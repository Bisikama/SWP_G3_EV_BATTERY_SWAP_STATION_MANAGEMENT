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
 * Activates an existing vehicle in the database by assigning it to a driver.
 * This does NOT create new vehicles - vehicles must be seeded in the database first.
 * 
 * Registration Flow:
 *   1. Driver provides VIN and license_plate
 *   2. System finds vehicle by VIN in database
 *   3. Checks if vehicle is available (driver_id = null, status = inactive)
 *   4. Assigns driver_id, license_plate and activates vehicle (status = active)
 * 
 * Validation checks:
 *   - All required fields provided (vin, license_plate)
 *   - VIN exists in database (seeded data)
 *   - Vehicle is available (driver_id = null)
 *   - Driver is valid and has required documents
 *   - License plate is unique
 * 
 * @param {string} driver_id - Driver's account ID from JWT token
 * @param {object} vehicleData - { vin, license_plate } - model_id is ignored, taken from seeded data
 * @returns {Promise<Vehicle>} Activated vehicle with model details
 * @throws {Error} Validation or business logic error with status code
 */
async function registerVehicle(driver_id, { vin, license_plate }) {
  
  // Step 1: Validate required fields
  if (!vin || !license_plate) {
    const err = new Error('VIN and license_plate are required');
    err.statusCode = 400;
    throw err;
  }

  const normalizedVin = vin.toUpperCase();

  // Step 2: Validate driver
  const driver = await Account.findByPk(driver_id);

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

  // Step 4: Find vehicle by VIN in database (seeded data)
  const vehicle = await Vehicle.findOne({ 
    where: { vin: normalizedVin },
    include: [
      {
        model: VehicleModel,
        as: 'model',
        attributes: ['model_id', 'name', 'brand']
      }
    ]
  });
  
  // Case A: VIN not found in database
  if (!vehicle) {
    const err = new Error('VIN not found in system. Please contact administrator to add this vehicle model to the database');
    err.statusCode = 404;
    err.field = 'vin';
    err.hint = 'Vehicle must be seeded in database before registration';
    throw err;
  }

  // Case B: Vehicle already has an owner (driver_id is not null)
  if (vehicle.driver_id !== null) {
    const err = new Error('This vehicle has already been registered by another account');
    err.statusCode = 409;
    err.field = 'vin';
    err.current_owner = vehicle.driver_id;
    throw err;
  }

  // Case C: Vehicle is inactive with null driver_id but has a license plate already
  // This shouldn't happen with proper seeding, but handle it anyway
  if (vehicle.license_plate !== null) {
    const err = new Error('This vehicle already has a license plate assigned. Please contact administrator');
    err.statusCode = 409;
    err.field = 'vin';
    throw err;
  }

  // Step 5: Check license plate is not taken by another vehicle
  const duplicatePlate = await Vehicle.findOne({ 
    where: { license_plate } 
  });
  
  if (duplicatePlate) {
    const err = new Error('License plate already registered to another vehicle');
    err.statusCode = 409;
    err.field = 'license_plate';
    throw err;
  }

  // Step 6: Activate vehicle - assign to driver
  vehicle.driver_id = driver_id;
  vehicle.license_plate = license_plate;
  vehicle.status = 'active';
  
  await vehicle.save();

  // Step 7: Return full vehicle details with model information
  return findVehicleWithModel(vehicle.vehicle_id);
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
 * Deactivates a vehicle and releases it back to the system.
 * This allows the vehicle to be registered by another driver in the future.
 * 
 * Changes made:
 *   - status → 'inactive'
 *   - driver_id → null (released from current owner)
 *   - license_plate → null (can be assigned new plate on re-registration)
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

  // Release vehicle back to system - can be registered by another driver
  vehicle.status = 'inactive';
  vehicle.driver_id = null;
  vehicle.license_plate = null;
  await vehicle.save();

  return {
    vehicle_id: vehicle.vehicle_id,
    vin: vehicle.vin,
    license_plate: null,
    status: vehicle.status,
    message: 'Vehicle released back to system and available for re-registration'
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
