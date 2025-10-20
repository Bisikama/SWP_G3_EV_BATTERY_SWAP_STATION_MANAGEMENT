// ========================================
// BOOKING SERVICE
// ========================================
// File: src/services/booking.service.js
// Mục đích: Business logic layer cho booking operations
// 
// Chức năng chính:
// 1. createBooking - Tạo booking mới với battery matching
// 2. getBookingsByDriver - Lấy danh sách bookings của driver
// 3. getBookingById - Lấy chi tiết booking
// 4. updateBooking - Cập nhật thời gian booking
// 5. checkVehicleOwnership - Kiểm tra quyền sở hữu vehicle
// 6. checkVehicleSubscription - Kiểm tra subscription active
// 7. findAvailableBatteries - Tìm battery available
// 8. checkDuplicateBooking - Kiểm tra trùng booking
// ========================================

'use strict';
const { 
  Booking, 
  BookingBattery,
  Vehicle, 
  VehicleModel,
  BatteryType,
  Station, 
  Account,
  Subscription,
  SubscriptionPlan,
  Battery,
  CabinetSlot,
  Cabinet,
  Sequelize,
  sequelize 
} = require('../models');
const { Op } = Sequelize;

/**
 * ========================================
 * CREATE BOOKING
 * ========================================
 * Tạo booking mới với tất cả validations
 * 
 * @param {string} driver_id - ID của driver (từ JWT token)
 * @param {object} bookingData - { vehicle_id, station_id, scheduled_start_time }
 * @returns {Promise<Booking>} - Booking vừa tạo (kèm relations)
 * @throws {Error} - Lỗi với status code
 */
async function createBooking(driver_id, { vehicle_id, station_id, scheduled_start_time, battery_count = 1 }) {
  // ============================================
  // TRANSACTION WRAPPER - Fix Race Condition
  // ============================================
  return await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
  }, async (t) => {
    
    // 1. Validate required fields
    if (!vehicle_id || !station_id || !scheduled_start_time) {
      const err = new Error('Vehicle ID, Station ID, and Scheduled start time are required');
      err.status = 400;
      throw err;
    }

    // 1b. Validate battery_count
    if (typeof battery_count !== 'number' || battery_count < 1 || !Number.isInteger(battery_count)) {
      const err = new Error('Battery count must be a positive integer');
      err.status = 400;
      throw err;
    }

    // 2. Check vehicle exists (WITH LOCK)
    const vehicle = await Vehicle.findByPk(vehicle_id, {
      include: [{
        model: VehicleModel,
        as: 'model',
        include: [{
          model: BatteryType,
          as: 'batteryType'
        }]
      }],
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!vehicle) {
      const err = new Error('Vehicle not found');
      err.status = 404;
      throw err;
    }

    // 3. Check vehicle ownership
    if (vehicle.driver_id !== driver_id) {
      const err = new Error('You do not own this vehicle');
      err.status = 403;
      throw err;
    }

    // 4. Check station exists and operational (WITH LOCK)
    const station = await Station.findOne({
      where: {
        station_id,
        status: 'operational'
      },
      lock: t.LOCK.UPDATE,
      transaction: t
    });
    
    if (!station) {
      const err = new Error('Station not found or not operational');
      err.status = 404;
      throw err;
    }

    // 5. Check vehicle has active subscription (WITH TRANSACTION)
    const activeSubscription = await checkVehicleSubscription(vehicle_id, t);

    // 5b. Check battery_count <= battery_cap
    const battery_cap = activeSubscription.plan.battery_cap;
    if (battery_count > battery_cap) {
      const err = new Error(`Your subscription plan allows maximum ${battery_cap} ${battery_cap === 1 ? 'battery' : 'batteries'} per swap. Requested: ${battery_count}`);
      err.status = 422;
      throw err;
    }

    // 6. Check duplicate booking (WITH LOCK)
    const startTime = new Date(scheduled_start_time);
    await checkDuplicateBooking(driver_id, vehicle_id, startTime, null, t);

    // 7. Calculate end time (15 minutes after start)
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 15);

    // 8. Find available batteries at station (WITH LOCK)
    const battery_type_id = vehicle.model.battery_type_id;
    
    let availableBatteries;
    try {
      console.log('[DEBUG] Searching for available batteries...', { station_id, battery_type_id });
      availableBatteries = await findAvailableBatteries(station_id, battery_type_id, startTime, t);
      console.log('[DEBUG] Found batteries:', availableBatteries.length);
    } catch (error) {
      console.error('[ERROR] findAvailableBatteries failed:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      throw error;
    }

    if (availableBatteries.length < battery_count) {
      const err = new Error(`Not enough available batteries at this station. Available: ${availableBatteries.length}, Requested: ${battery_count}`);
      err.status = 422;
      throw err;
    }

    // 9. Create booking (IN TRANSACTION)
    const newBooking = await Booking.create({
      driver_id,
      vehicle_id,
      station_id,
      scheduled_start_time: startTime,
      scheduled_end_time: endTime
    }, { transaction: t });

    // 10. Select batteries and double-check availability (CONFLICT DETECTION)
    const selectedBatteries = availableBatteries.slice(0, battery_count);
    
    // Re-verify batteries are still available with lock
    const batteryIds = selectedBatteries.map(b => b.battery_id);
    const lockedBatteries = await Battery.findAll({
      where: {
        battery_id: { [Op.in]: batteryIds },
        current_soc: { [Op.gt]: 90 },
        current_soh: { [Op.gte]: 90 }
      },
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (lockedBatteries.length < battery_count) {
      const err = new Error('Battery availability changed during booking. Please try again.');
      err.status = 409; // Conflict
      throw err;
    }

    // 11. Associate batteries with booking (IN TRANSACTION)
    const bookingBatteryPromises = lockedBatteries.map(battery => 
      BookingBattery.create({
        booking_id: newBooking.booking_id,
        battery_id: battery.battery_id
      }, { transaction: t })
    );
    
    await Promise.all(bookingBatteryPromises);

    // 12. Return booking with full details (outside transaction for read)
    // Transaction will commit here automatically if no errors
    return getBookingById(newBooking.booking_id, driver_id);
  });
}

/**
 * ========================================
 * GET BOOKINGS BY DRIVER
 * ========================================
 * Lấy danh sách bookings của driver với pagination và filter
 * 
 * @param {string} driver_id - ID của driver
 * @param {object} options - { page, limit, status }
 * @returns {Promise<object>} - { bookings, pagination }
 */
async function getBookingsByDriver(driver_id, { page = 1, limit = 10, status } = {}) {
  if (!driver_id) {
    const err = new Error('Driver ID is required');
    err.status = 400;
    throw err;
  }

  const offset = (page - 1) * limit;

  // Build where clause
  const where = { driver_id };
  
  // Add status filter if provided
  if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
    where.status = status;
  }

  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: [
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['vehicle_id', 'license_plate'],
        include: [{
          model: VehicleModel,
          as: 'model',
          attributes: ['name', 'brand']
        }]
      },
      {
        model: Station,
        as: 'station',
        attributes: ['station_id', 'station_name', 'address', 'status']
      },
      {
        model: Battery,
        as: 'batteries',
        attributes: ['battery_id', 'battery_serial', 'current_soc'],
        through: { attributes: [] } // Không lấy attributes từ bảng trung gian
      }
    ],
    order: [['scheduled_start_time', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return {
    bookings: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  };
}

/**
 * ========================================
 * GET BOOKING BY ID
 * ========================================
 * Lấy chi tiết booking theo ID với full relations
 * 
 * @param {string} booking_id - UUID của booking
 * @param {string} driver_id - ID của driver (để check ownership)
 * @returns {Promise<Booking>} - Booking details
 */
async function getBookingById(booking_id, driver_id = null) {
  if (!booking_id) {
    const err = new Error('Booking ID is required');
    err.status = 400;
    throw err;
  }

  const booking = await Booking.findByPk(booking_id, {
    include: [
      {
        model: Account,
        as: 'driver',
        attributes: ['account_id', 'fullname', 'email', 'phone_number']
      },
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['vehicle_id', 'license_plate', 'vin'],
        include: [{
          model: VehicleModel,
          as: 'model',
          attributes: ['model_id', 'name', 'brand', 'avg_energy_usage'],
          include: [{
            model: BatteryType,
            as: 'batteryType',
            attributes: ['battery_type_id', 'battery_type_code', 'nominal_capacity']
          }]
        }]
      },
      {
        model: Station,
        as: 'station',
        attributes: ['station_id', 'station_name', 'address', 'latitude', 'longitude', 'status']
      },
      {
        model: Battery,
        as: 'batteries',
        attributes: ['battery_id', 'battery_serial', 'current_soc', 'current_soh'],
        through: { attributes: [] }
      }
    ]
  });

  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  // Check ownership nếu driver_id được cung cấp
  if (driver_id && booking.driver_id !== driver_id) {
    const err = new Error('You do not have permission to view this booking');
    err.status = 403;
    throw err;
  }

  return booking;
}

/**
 * ========================================
 * UPDATE BOOKING
 * ========================================
 * Cập nhật thời gian booking
 * 
 * @param {string} booking_id - UUID của booking
 * @param {string} driver_id - ID của driver (để check ownership)
 * @param {object} updateData - { scheduled_start_time }
 * @returns {Promise<Booking>} - Updated booking
 */
async function updateBooking(booking_id, driver_id, { scheduled_start_time }) {
  if (!booking_id || !scheduled_start_time) {
    const err = new Error('Booking ID and scheduled start time are required');
    err.status = 400;
    throw err;
  }

  // 1. Find booking
  const booking = await Booking.findByPk(booking_id);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  // 2. Check ownership
  if (booking.driver_id !== driver_id) {
    const err = new Error('You do not have permission to update this booking');
    err.status = 403;
    throw err;
  }

  // 3. Check status is pending (không cho update booking đã completed/cancelled)
  if (booking.status !== 'pending') {
    const err = new Error(`Cannot update booking with status '${booking.status}'. Only pending bookings can be updated.`);
    err.status = 422;
    throw err;
  }

  // 4. Check booking hasn't passed
  const now = new Date();
  if (new Date(booking.scheduled_start_time) < now) {
    const err = new Error('Cannot update a booking that has already started or passed');
    err.status = 422;
    throw err;
  }

  // 5. Check new time is valid
  const newStartTime = new Date(scheduled_start_time);
  
  // 6. Check duplicate with new time
  await checkDuplicateBooking(driver_id, booking.vehicle_id, newStartTime, booking_id);

  // 7. Calculate new end time
  const newEndTime = new Date(newStartTime);
  newEndTime.setMinutes(newEndTime.getMinutes() + 15);

  // 8. Update booking
  await booking.update({
    scheduled_start_time: newStartTime,
    scheduled_end_time: newEndTime
  });

  // 9. Return updated booking
  return getBookingById(booking_id, driver_id);
}

/**
 * ========================================
 * CANCEL BOOKING (SOFT DELETE)
 * ========================================
 * Hủy booking bằng cách update status = 'cancelled'
 * 
 * @param {string} booking_id - UUID của booking
 * @param {string} driver_id - ID của driver (để check ownership)
 * @returns {Promise<object>} - { message, booking_id }
 */
async function cancelBooking(booking_id, driver_id) {
  if (!booking_id) {
    const err = new Error('Booking ID is required');
    err.status = 400;
    throw err;
  }

  // 1. Find booking
  const booking = await Booking.findByPk(booking_id);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  // 2. Check ownership
  if (booking.driver_id !== driver_id) {
    const err = new Error('You do not have permission to cancel this booking');
    err.status = 403;
    throw err;
  }

  // 3. Check status is pending
  if (booking.status !== 'pending') {
    const err = new Error(`Cannot cancel booking with status '${booking.status}'. Only pending bookings can be cancelled.`);
    err.status = 422;
    throw err;
  }

  // 4. Check not too close to start time (5 minutes buffer)
  const now = new Date();
  const bufferTime = new Date(booking.scheduled_start_time);
  bufferTime.setMinutes(bufferTime.getMinutes() - 5);

  if (now > bufferTime) {
    const err = new Error('Cannot cancel booking within 5 minutes of scheduled start time');
    err.status = 422;
    throw err;
  }

  // 5. Update status to cancelled
  await booking.update({ status: 'cancelled' });

  return { 
    message: 'Booking cancelled successfully',
    booking_id: booking.booking_id
  };
}

/**
 * ========================================
 * HELPER: CHECK VEHICLE SUBSCRIPTION
 * ========================================
 * Kiểm tra vehicle có subscription active không
 * 
 * @param {string} vehicle_id - UUID của vehicle
 * @param {Transaction} t - Sequelize transaction (optional)
 * @throws {Error} - Nếu không có subscription active
 */
async function checkVehicleSubscription(vehicle_id, t = null) {
  const today = new Date().toISOString().split('T')[0];

  const queryOptions = {
    where: {
      vehicle_id,
      cancel_time: null,
      end_date: { [Op.gte]: today }
    },
    include: [
      {
        model: SubscriptionPlan,
        as: 'plan',
        attributes: ['battery_cap', 'plan_name']
      }
    ]
  };

  // Add transaction if provided
  if (t) {
    queryOptions.lock = t.LOCK.UPDATE;
    queryOptions.transaction = t;
  }

  const activeSubscription = await Subscription.findOne(queryOptions);

  if (!activeSubscription) {
    const err = new Error('Vehicle does not have an active subscription. Please subscribe first.');
    err.status = 422;
    throw err;
  }

  return activeSubscription;
}

/**
 * ========================================
 * HELPER: FIND AVAILABLE BATTERIES
 * ========================================
 * Tìm batteries available tại station trong time slot
 * 
 * @param {number} station_id - ID của station
 * @param {number} battery_type_id - ID của battery type
 * @param {Date} datetime - Thời gian booking
 * @param {Transaction} t - Sequelize transaction (optional)
 * @returns {Promise<Battery[]>} - Danh sách batteries available
 */
async function findAvailableBatteries(station_id, battery_type_id, datetime, t = null) {
  // 1. Tìm tất cả cabinets tại station
  console.log('[findAvailableBatteries] Searching for cabinets at station:', station_id);
  
  let cabinets;
  try {
    const cabinetQueryOptions = {
      where: { 
        station_id,
        status: 'operational'
      },
      include: [{
        model: CabinetSlot,
        as: 'slots',
        where: {
          status: { [Op.in]: ['charging', 'charged'] }
        },
        required: false
      }]
    };

    // Add transaction and lock if provided
    if (t) {
      cabinetQueryOptions.lock = t.LOCK.UPDATE;
      cabinetQueryOptions.transaction = t;
    }

    cabinets = await Cabinet.findAll(cabinetQueryOptions);
    console.log('[findAvailableBatteries] Found cabinets:', cabinets.length);
  } catch (error) {
    console.error('[ERROR] Cabinet query failed:', error.message);
    throw error;
  }

  if (cabinets.length === 0) {
    return [];
  }

  // 2. Lấy tất cả slot_ids
  const slotIds = [];
  cabinets.forEach(cabinet => {
    if (cabinet.slots) {
      cabinet.slots.forEach(slot => slotIds.push(slot.slot_id));
    }
  });

  if (slotIds.length === 0) {
    return [];
  }

  // 3. Tìm batteries trong các slots này (WITH LOCK if in transaction)
  const batteryQueryOptions = {
    where: {
      slot_id: { [Op.in]: slotIds },
      battery_type_id,
      current_soc: { [Op.gt]: 90 }, // Pin phải có hơn 90% SOC
      current_soh: { [Op.gte]: 90 } // Pin phải có SOH >= 90%
    },
    include: [{
      model: CabinetSlot,
      as: 'cabinetSlot',
      where: {
        status: 'charged' // Ưu tiên pin đã sạc đầy
      },
      required: false
    }]
  };

  // Add transaction and lock if provided
  if (t) {
    batteryQueryOptions.lock = t.LOCK.UPDATE;
    batteryQueryOptions.transaction = t;
  }

  const batteries = await Battery.findAll(batteryQueryOptions);

  // 4. Trả về tất cả batteries available
  // Miễn còn pin đủ điều kiện là được, hệ thống sẽ tự phân bổ
  return batteries;
}

/**
 * ========================================
 * HELPER: CHECK DUPLICATE BOOKING
 * ========================================
 * Kiểm tra driver/vehicle có booking trùng time slot không
 * 
 * @param {string} driver_id - UUID của driver
 * @param {string} vehicle_id - UUID của vehicle
 * @param {Date} startTime - Thời gian booking
 * @param {string} excludeBookingId - Booking ID cần exclude (khi update)
 * @param {Transaction} t - Sequelize transaction (optional)
 * @throws {Error} - Nếu có duplicate booking
 */
async function checkDuplicateBooking(driver_id, vehicle_id, startTime, excludeBookingId = null, t = null) {
  // Check trong khoảng ±30 phút
  const timeSlotStart = new Date(startTime);
  timeSlotStart.setMinutes(timeSlotStart.getMinutes() - 30);
  
  const timeSlotEnd = new Date(startTime);
  timeSlotEnd.setMinutes(timeSlotEnd.getMinutes() + 30);

  const whereClause = {
    [Op.or]: [
      { driver_id },
      { vehicle_id }
    ],
    scheduled_start_time: {
      [Op.between]: [timeSlotStart, timeSlotEnd]
    },
    // Only check pending bookings, ignore cancelled/completed (completed shouldn't block new swaps)
    status: {
      [Op.in]: ['pending']
    }
  };

  // Exclude booking hiện tại khi update
  if (excludeBookingId) {
    whereClause.booking_id = { [Op.ne]: excludeBookingId };
  }

  const queryOptions = {
    where: whereClause
  };

  // Add transaction and lock if provided
  if (t) {
    queryOptions.lock = t.LOCK.UPDATE;
    queryOptions.transaction = t;
  }

  const duplicateBooking = await Booking.findOne(queryOptions);

  if (duplicateBooking) {
    const err = new Error('You already have a booking in this time slot (±30 minutes). Please choose another time.');
    err.status = 409;
    throw err;
  }
}

/**
 * ========================================
 * CHECK AVAILABILITY (Current time only)
 * ========================================
 * Kiểm tra station hiện tại có pin phù hợp với loại xe hay không
 * 
 * @param {number} station_id - ID của station
 * @param {string} vehicle_id - UUID của vehicle (để check battery type)
 * @returns {Promise<object>} - Availability info
 */
async function checkAvailability(station_id, vehicle_id) {
  // 1. Check station exists and is operational
  const station = await Station.findByPk(station_id);
  if (!station) {
    const err = new Error('Station not found');
    err.status = 404;
    throw err;
  }

  if (station.status !== 'operational') {
    return {
      available: false,
      message: `Station is currently ${station.status}`,
      details: {
        station_id: station.station_id,
        station_name: station.station_name,
        status: station.status
      }
    };
  }

  // 2. Get vehicle and its battery type
  const vehicle = await Vehicle.findByPk(vehicle_id, {
    include: [{
      model: VehicleModel,
      as: 'model',
      include: [{
        model: BatteryType,
        as: 'batteryType'
      }]
    }]
  });

  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  const battery_type_id = vehicle.model.battery_type_id;
  const battery_type_code = vehicle.model.batteryType.battery_type_code;

  // 3. Find available batteries for this battery type RIGHT NOW
  const now = new Date();
  const availableBatteries = await findAvailableBatteries(station_id, battery_type_id, now);

  // 4. Count current pending bookings at this station (within next 30 minutes)
  const next30Min = new Date(now.getTime() + 30 * 60000);
  
  const currentPendingBookings = await Booking.count({
    where: {
      station_id,
      status: 'pending',
      scheduled_start_time: {
        [Op.between]: [now, next30Min]
      }
    }
  });

  // 5. Get total capacity of station
  const totalSlots = await CabinetSlot.count({
    include: [{
      model: Cabinet,
      as: 'cabinet',
      where: { station_id }
    }]
  });

  // 6. Calculate effective availability
  const effectiveAvailable = Math.max(0, availableBatteries.length - currentPendingBookings);
  const isAvailable = effectiveAvailable > 0;

  return {
    available: isAvailable,
    message: isAvailable 
      ? `Station has available batteries for ${battery_type_code}` 
      : `No ${battery_type_code} batteries available at this station right now`,
    station: {
      station_id: station.station_id,
      station_name: station.station_name,
      address: station.address,
      status: station.status
    },
    battery_type: {
      battery_type_id,
      battery_type_code
    },
    availability_details: {
      available_batteries_count: availableBatteries.length,
      total_slots: totalSlots,
      current_pending_bookings: currentPendingBookings,
      effective_available: effectiveAvailable,
      station_status: station.status
    }
  };
}

module.exports = {
  createBooking,
  getBookingsByDriver,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkAvailability
};
