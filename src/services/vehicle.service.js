// ========================================
// VEHICLE SERVICE
// ========================================
// File: src/services/vehicle.service.js
// Mục đích: Business logic layer cho vehicle operations
// 
// Chức năng chính:
// 1. registerVehicle - Đăng ký xe mới
// 2. getVehiclesByDriver - Lấy danh sách xe của driver
// 3. getVehicleByVin - Tìm xe theo VIN
// 4. getVehicleById - Tìm xe theo ID
// 5. updateVehicle - Cập nhật thông tin xe
// 6. deleteVehicle - Xóa xe
// 7. checkVehicleOwnership - Kiểm tra quyền sở hữu
// 8. findVehicleWithModel - Helper function
// ========================================

'use strict';
const { Vehicle, VehicleModel, BatteryType, Account, Subscription, Booking, Sequelize } = require('../models');
const { Op } = Sequelize;

/**
 * ========================================
 * REGISTER VEHICLE
 * ========================================
 * Đăng ký xe mới cho driver
 * 
 * @param {string} driver_id - ID của driver (từ JWT token)
 * @param {object} vehicleData - { vin, model_id, license_plate }
 * @returns {Promise<Vehicle>} - Thông tin xe vừa tạo (kèm model)
 * @throws {Error} - Lỗi với status code
 */
async function registerVehicle(driver_id, { vin, model_id, license_plate }) {
  // Validate required fields
  if (!vin || !model_id || !license_plate) {
    const err = new Error('VIN, model_id, and license_plate are required');
    err.status = 400;
    throw err;
  }

  // Chuẩn hóa VIN sang uppercase
  const normalizedVin = vin.toUpperCase();

  // Check VIN duplicate
  const existingVin = await Vehicle.findOne({ 
    where: { vin: normalizedVin } 
  });
  
  if (existingVin) {
    const err = new Error('VIN already registered');
    err.status = 409;
    err.field = 'vin';
    throw err;
  }

  // Check license plate duplicate
  const existingPlate = await Vehicle.findOne({ 
    where: { license_plate } 
  });
  
  if (existingPlate) {
    const err = new Error('License plate already registered');
    err.status = 409;
    err.field = 'license_plate';
    throw err;
  }

  // Validate model exists
  const vehicleModel = await VehicleModel.findByPk(model_id);
  if (!vehicleModel) {
    const err = new Error('Vehicle model not found');
    err.status = 404;
    err.field = 'model_id';
    throw err;
  }

  // Check driver role
  const driver = await Account.findByPk(driver_id);
  if (!driver || driver.role !== 'driver') {
    const err = new Error('Only drivers can register vehicles');
    err.status = 403;
    throw err;
  }

  // Create vehicle
  const newVehicle = await Vehicle.create({
    driver_id,
    model_id,
    vin: normalizedVin,
    license_plate
  });

  // Return vehicle with model information
  return findVehicleWithModel(newVehicle.vehicle_id);
}

/**
 * ========================================
 * GET VEHICLES BY DRIVER
 * ========================================
 * Lấy tất cả xe của driver
 * 
 * @param {string} driver_id - ID của driver
 * @returns {Promise<Vehicle[]>} - Danh sách xe (kèm model)
 */
async function getVehiclesByDriver(driver_id) {
  if (!driver_id) {
    const err = new Error('Driver ID is required');
    err.status = 400;
    throw err;
  }

  const vehicles = await Vehicle.findAll({
    where: { driver_id },
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
 * ========================================
 * GET VEHICLE BY VIN
 * ========================================
 * Tìm xe theo VIN (public lookup)
 * 
 * @param {string} vin - VIN của xe
 * @returns {Promise<Vehicle|null>} - Thông tin xe (kèm model và driver)
 */
async function getVehicleByVin(vin) {
  if (!vin) {
    const err = new Error('VIN is required');
    err.status = 400;
    throw err;
  }

  // Chuẩn hóa VIN sang uppercase
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
    err.status = 404;
    throw err;
  }

  return vehicle;
}

/**
 * ========================================
 * GET VEHICLE BY ID
 * ========================================
 * Tìm xe theo vehicle_id
 * 
 * @param {string} vehicle_id - UUID của xe
 * @param {boolean} includeRelations - Có include relations không
 * @returns {Promise<Vehicle|null>} - Thông tin xe
 */
async function getVehicleById(vehicle_id, includeRelations = true) {
  if (!vehicle_id) {
    const err = new Error('Vehicle ID is required');
    err.status = 400;
    throw err;
  }

  if (includeRelations) {
    return findVehicleWithModel(vehicle_id);
  }

  const vehicle = await Vehicle.findByPk(vehicle_id);
  
  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  return vehicle;
}

/**
 * ========================================
 * UPDATE VEHICLE
 * ========================================
 * Cập nhật thông tin xe
 * 
 * @param {string} vehicle_id - UUID của xe
 * @param {string} driver_id - ID của driver (để check ownership)
 * @param {object} updates - { license_plate?, model_id? }
 * @returns {Promise<Vehicle>} - Thông tin xe đã cập nhật
 * @throws {Error} - Lỗi với status code
 */
async function updateVehicle(vehicle_id, driver_id, updates) {
  const { license_plate, model_id } = updates;

  // Validate at least one field to update
  if (!license_plate && !model_id) {
    const err = new Error('At least one field (license_plate or model_id) is required to update');
    err.status = 400;
    throw err;
  }

  // Find vehicle
  const vehicle = await Vehicle.findByPk(vehicle_id);
  
  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  // Check ownership
  if (vehicle.driver_id !== driver_id) {
    const err = new Error('You can only update your own vehicles');
    err.status = 403;
    throw err;
  }

  // Update license_plate if provided
  if (license_plate && license_plate !== vehicle.license_plate) {
    // Check duplicate
    const existingPlate = await Vehicle.findOne({ 
      where: { license_plate } 
    });
    
    if (existingPlate) {
      const err = new Error('License plate already exists');
      err.status = 409;
      err.field = 'license_plate';
      throw err;
    }
    
    vehicle.license_plate = license_plate;
  }

  // Update model_id if provided
  if (model_id && model_id !== vehicle.model_id) {
    // Validate model exists
    const vehicleModel = await VehicleModel.findByPk(model_id);
    
    if (!vehicleModel) {
      const err = new Error('Vehicle model not found');
      err.status = 404;
      err.field = 'model_id';
      throw err;
    }
    
    vehicle.model_id = model_id;
  }

  // Save changes
  await vehicle.save();

  // Return updated vehicle with model
  return findVehicleWithModel(vehicle_id);
}

/**
 * ========================================
 * DELETE VEHICLE (SOFT DELETE)
 * ========================================
 * Soft delete xe - set status = 'inactive'
 * 
 * @param {string} vehicle_id - UUID của xe
 * @param {string} driver_id - ID của driver (để check ownership)
 * @returns {Promise<object>} - Thông tin xe đã deactivate
 * @throws {Error} - Lỗi với status code
 */
async function deleteVehicle(vehicle_id, driver_id) {
  // Find vehicle
  const vehicle = await Vehicle.findByPk(vehicle_id);
  
  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  // Check ownership
  if (vehicle.driver_id !== driver_id) {
    const err = new Error('You can only delete your own vehicles');
    err.status = 403;
    throw err;
  }

  // Check nếu xe đã inactive rồi
  if (vehicle.status === 'inactive') {
    const err = new Error('Vehicle is already deactivated');
    err.status = 400;
    throw err;
  }

  // Check active subscription và pending bookings (parallel queries)
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

  // Check active subscription
  if (activeSubscription) {
    const err = new Error('Cannot deactivate vehicle. Active subscription exists. Please cancel subscription first');
    err.status = 409;
    throw err;
  }

  // Check pending bookings
  if (pendingBooking) {
    const err = new Error('Cannot deactivate vehicle. Pending bookings exist. Please cancel bookings first');
    err.status = 409;
    throw err;
  }

  // Soft delete - set status = inactive
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
 * ========================================
 * CHECK VEHICLE OWNERSHIP
 * ========================================
 * Kiểm tra xe có thuộc về driver không
 * 
 * @param {string} vehicle_id - UUID của xe
 * @param {string} driver_id - ID của driver
 * @returns {Promise<boolean>} - true nếu là chủ xe
 */
async function checkVehicleOwnership(vehicle_id, driver_id) {
  const vehicle = await Vehicle.findByPk(vehicle_id);
  
  if (!vehicle) {
    return false;
  }

  return vehicle.driver_id === driver_id;
}

/**
 * ========================================
 * FIND VEHICLE WITH MODEL (HELPER)
 * ========================================
 * Helper function để lấy vehicle kèm model info
 * 
 * @param {string} vehicle_id - UUID của xe
 * @returns {Promise<Vehicle>} - Thông tin xe kèm model
 */
async function findVehicleWithModel(vehicle_id) {
  const vehicle = await Vehicle.findByPk(vehicle_id, {
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

  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  return vehicle;
}

/**
 * ========================================
 * GET VEHICLES WITHOUT BATTERIES (IDs only)
 * ========================================
 * Lấy danh sách vehicle_id và driver_id của xe chưa có pin
 * 
 * @returns {Promise<Array<object>>} - Mảng {vehicle_id, driver_id}
 */
async function getVehiclesWithoutBatteries() {
  const { Battery, Sequelize } = require('../models');
  const { Op } = Sequelize;

  // Query tất cả xe và check battery
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

  // Filter ra những xe không có battery nào và map sang object
  const vehiclesWithoutBattery = vehicles
    .filter(vehicle => !vehicle.batteries || vehicle.batteries.length === 0)
    .map(vehicle => ({
      vehicle_id: vehicle.vehicle_id,
      account_id: vehicle.driver_id
    }));

  return vehiclesWithoutBattery;
}

// ========================================
// EXPORTS
// ========================================
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
