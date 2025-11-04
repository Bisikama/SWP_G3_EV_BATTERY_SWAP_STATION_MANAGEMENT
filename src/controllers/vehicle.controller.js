/**
 * Vehicle Controller
 * 
 * HTTP request/response handlers for vehicle operations.
 * This is a thin controller that:
 *   - Extracts data from request (body, params, query, user)
 *   - Calls appropriate service methods
 *   - Formats and returns HTTP responses
 * 
 * Business logic is handled in vehicle.service.js
 * Error handling is automatic via asyncHandler middleware
 */

'use strict';

const vehicleService = require('../services/vehicle.service');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * Register Vehicle
 * POST /api/vehicles
 * 
 * Registers a new vehicle for the authenticated driver.
 * 
 * Access: Private (driver only)
 */
const registerVehicle = asyncHandler(async (req, res) => {
  const { vin, model_id, license_plate } = req.body;
  const driver_id = req.user.account_id;

  const vehicle = await vehicleService.registerVehicle(driver_id, {
    vin,
    model_id,
    license_plate
  });

  return res.status(201).json({
    message: 'Vehicle registered successfully',
    vehicle
  });
});

/**
 * Get My Vehicles
 * GET /api/vehicles?status=active|inactive|all
 * 
 * Retrieves all vehicles owned by the authenticated driver.
 * Optional status filter via query parameter.
 * 
 * Access: Private
 */
const getMyVehicles = asyncHandler(async (req, res) => {
  const driver_id = req.user.account_id;
  const { status } = req.query;

  const vehicles = await vehicleService.getVehiclesByDriver(driver_id, { status });

  return res.status(200).json({
    message: 'Vehicles retrieved successfully',
    count: vehicles.length,
    vehicles
  });
});

/**
 * Get Vehicle by VIN
 * GET /api/vehicles/vin/:vin
 * 
 * Looks up a vehicle by its VIN number.
 * Returns vehicle info including model and owner details.
 * 
 * Access: Public
 */
const getVehicleByVin = asyncHandler(async (req, res) => {
  const { vin } = req.params;

  const vehicle = await vehicleService.getVehicleByVin(vin);

  return res.status(200).json({
    message: 'Vehicle found',
    vehicle
  });
});

/**
 * Get Vehicle by ID
 * GET /api/vehicles/:id
 * 
 * Retrieves vehicle information by vehicle ID.
 * 
 * Access: Private
 */
const getVehicleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await vehicleService.getVehicleById(id, true);

  return res.status(200).json({
    message: 'Vehicle found',
    vehicle
  });
});

/**
 * Update Vehicle
 * PUT /api/vehicles/:id
 * 
 * Updates vehicle information (license plate or model).
 * Only the vehicle owner can update.
 * 
 * Access: Private (owner only)
 */
const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driver_id = req.user.account_id;
  const { license_plate, model_id } = req.body;

  const vehicle = await vehicleService.updateVehicle(id, driver_id, {
    license_plate,
    model_id
  });

  return res.status(200).json({
    message: 'Vehicle updated successfully',
    vehicle
  });
});

/**
 * Delete Vehicle
 * DELETE /api/vehicles/:id
 * 
 * Soft deletes a vehicle by setting status to inactive.
 * Only the vehicle owner can delete.
 * 
 * Access: Private (owner only)
 */
const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driver_id = req.user.account_id;

  const deletedVehicle = await vehicleService.deleteVehicle(id, driver_id);

  return res.status(200).json({
    message: 'Vehicle deleted successfully',
    deleted_vehicle: deletedVehicle
  });
});

/**
 * Get Vehicles Without Batteries
 * GET /api/vehicles/without-batteries
 * 
 * Returns list of vehicle IDs and account IDs for vehicles
 * that don't have any batteries assigned yet.
 * 
 * Access: Private
 */
const getVehiclesWithoutBatteries = asyncHandler(async (req, res) => {
  const vehicles = await vehicleService.getVehiclesWithoutBatteries();

  return res.status(200).json({
    message: 'Vehicles without batteries retrieved successfully',
    count: vehicles.length,
    vehicles
  });
});

/**
 * Get Vehicles by User ID
 * GET /api/vehicles/user/:userId
 * 
 * Retrieves all active vehicles for a specific user.
 * Used by kiosk systems - no authentication required.
 * 
 * Access: Public
 */
const getVehiclesByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const vehicles = await vehicleService.getVehiclesByDriver(userId, { 
    status: 'active' 
  });

  return res.status(200).json({
    message: vehicles.length > 0 
      ? 'Vehicles retrieved successfully' 
      : 'No vehicles found for this user',
    count: vehicles.length,
    vehicles
  });
});

module.exports = {
  registerVehicle,
  getMyVehicles,
  getVehicleByVin,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehiclesWithoutBatteries,
  getVehiclesByUserId
};
