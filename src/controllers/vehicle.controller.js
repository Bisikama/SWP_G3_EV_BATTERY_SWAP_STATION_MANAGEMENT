// ========================================
// VEHICLE CONTROLLER
// ========================================
// File: src/controllers/vehicle.controller.js
// Mục đích: HTTP request/response handler cho vehicle operations
// 
// Thin controller - chỉ xử lý:
// 1. Extract data từ request (body, params, user)
// 2. Call service methods
// 3. Format và return response
// 4. Error handling được xử lý tự động bởi asyncHandler
// 
// Business logic nằm trong vehicle.service.js
// ========================================

'use strict';
const vehicleService = require('../services/vehicle.service');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * ========================================
 * REGISTER VEHICLE
 * ========================================
 * POST /api/vehicles
 * 
 * @description Đăng ký xe mới cho driver
 * @access Private (driver only)
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
 * ========================================
 * GET MY VEHICLES
 * ========================================
 * GET /api/vehicles?status=active|inactive|all
 * 
 * @description Lấy danh sách xe của driver đang đăng nhập
 * @query status - Filter by status (default: 'active')
 * @access Private
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
 * ========================================
 * GET VEHICLE BY VIN
 * ========================================
 * GET /api/vehicles/vin/:vin
 * 
 * @description Tra cứu xe theo VIN (public endpoint)
 * @access Public
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
 * ========================================
 * GET VEHICLE BY ID
 * ========================================
 * GET /api/vehicles/:id
 * 
 * @description Lấy thông tin xe theo ID
 * @access Private
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
 * ========================================
 * UPDATE VEHICLE
 * ========================================
 * PUT /api/vehicles/:id
 * 
 * @description Cập nhật thông tin xe
 * @access Private (owner only)
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
 * ========================================
 * DELETE VEHICLE
 * ========================================
 * DELETE /api/vehicles/:id
 * 
 * @description Xóa xe
 * @access Private (owner only)
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
 * ========================================
 * GET VEHICLES WITHOUT BATTERIES (IDs only)
 * ========================================
 * GET /api/vehicles/without-batteries
 * 
 * @description Lấy danh sách vehicle_id và account_id của xe chưa có pin
 * @access Private
 */
const getVehiclesWithoutBatteries = asyncHandler(async (req, res) => {
  const vehicles = await vehicleService.getVehiclesWithoutBatteries();

  return res.status(200).json({
    message: 'Vehicles without batteries retrieved successfully',
    count: vehicles.length,
    vehicles: vehicles
  });
});

/**
 * ========================================
 * GET VEHICLES BY USER ID (KIOSK - NO AUTH)
 * ========================================
 * GET /api/vehicles/user/:userId
 * 
 * @description Lấy danh sách xe của user (dành cho kiosk - không cần token)
 * @access Public
 */
const getVehiclesByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Gọi service để lấy vehicles (chỉ active)
  const vehicles = await vehicleService.getVehiclesByDriver(userId, { status: 'active' });

  return res.status(200).json({
    message: vehicles.length > 0 
      ? 'Vehicles retrieved successfully' 
      : 'No vehicles found for this user',
    count: vehicles.length,
    vehicles
  });
});

// ========================================
// EXPORTS
// ========================================
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
