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
 * HELPER: FORMAT DATETIME TO VIETNAM TIMEZONE
 * ========================================
 * Convert UTC datetime to Vietnam timezone (GMT+7) format
 * 
 * @param {Date|string} date - UTC date to convert
 * @returns {string} - Formatted datetime string (YYYY-MM-DD HH:mm:ss)
 */
function formatToVietnamTime(date) {
  if (!date) return null;
  
  const d = new Date(date);
  // Convert to Vietnam timezone (UTC+7)
  const vietnamTime = new Date(d.getTime() + (7 * 60 * 60 * 1000));
  
  // Format as YYYY-MM-DD HH:mm:ss
  const year = vietnamTime.getUTCFullYear();
  const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
  const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
  const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * ========================================
 * HELPER: FORMAT BOOKING RESPONSE
 * ========================================
 * Format booking object with Vietnam timezone for all datetime fields
 * 
 * @param {Booking} booking - Booking object from database
 * @returns {object} - Formatted booking object
 */
function formatBookingResponse(booking) {
  if (!booking) return null;
  
  const bookingData = booking.toJSON ? booking.toJSON() : booking;
  
  // Format all datetime fields to Vietnam timezone
  if (bookingData.scheduled_time) {
    bookingData.scheduled_time = formatToVietnamTime(bookingData.scheduled_time);
  }
  if (bookingData.create_time) {
    bookingData.create_time = formatToVietnamTime(bookingData.create_time);
  }
  if (bookingData.actual_start_time) {
    bookingData.actual_start_time = formatToVietnamTime(bookingData.actual_start_time);
  }
  if (bookingData.actual_end_time) {
    bookingData.actual_end_time = formatToVietnamTime(bookingData.actual_end_time);
  }
  
  return bookingData;
}

/**
 * ========================================
 * CREATE BOOKING
 * ========================================
 * Tạo booking mới với tất cả validations
 * 
 * @param {string} driver_id - ID của driver (từ JWT token)
 * @param {object} bookingData - { vehicle_id, station_id, scheduled_time, battery_quantity }
 * @returns {Promise<Booking>} - Booking vừa tạo (kèm relations)
 * @throws {Error} - Lỗi với status code
 */
async function createBooking(driver_id, { vehicle_id, station_id, scheduled_time, battery_quantity = 1 }) {
  // ============================================
  // TRANSACTION WRAPPER - Fix Race Condition
  // ============================================
  return await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
  }, async (t) => {
    
    // 1. Validate required fields
    if (!vehicle_id || !station_id || !scheduled_time) {
      const err = new Error('Vehicle ID, Station ID, and Scheduled time are required');
      err.status = 400;
      throw err;
    }

    // Validate battery_quantity
    if (!Number.isInteger(battery_quantity) || battery_quantity < 1) {
      const err = new Error('Battery quantity must be a positive integer');
      err.status = 400;
      throw err;
    }

    // Validate scheduled_time is in the future
    const scheduledTime = new Date(scheduled_time);
    const now = new Date();
    if (scheduledTime <= now) {
      const err = new Error('Scheduled time must be in the future');
      err.status = 400;
      throw err;
    }

    // 2. Check vehicle exists (WITH LOCK - no include to avoid JOIN lock issue)
    const vehicle = await Vehicle.findByPk(vehicle_id, {
      attributes: ['vehicle_id', 'driver_id', 'model_id', 'license_plate'],
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!vehicle) {
      const err = new Error('Vehicle not found');
      err.status = 404;
      throw err;
    }

    // Get vehicle model and battery type separately (no lock needed for reference data)
    const vehicleModel = await VehicleModel.findByPk(vehicle.model_id, {
      include: [{
        model: BatteryType,
        as: 'batteryType'
      }],
      transaction: t
    });

    if (!vehicleModel || !vehicleModel.batteryType) {
      const err = new Error('Vehicle model or battery type not found');
      err.status = 404;
      throw err;
    }

    // Attach model to vehicle for consistent object structure
    vehicle.model = vehicleModel;

    // 2b. Validate battery_quantity against vehicle's battery_slot capacity
    if (battery_quantity > vehicleModel.battery_slot) {
      const err = new Error(
        `This vehicle (${vehicleModel.brand} ${vehicleModel.name}) can only swap up to ${vehicleModel.battery_slot} ${vehicleModel.battery_slot === 1 ? 'battery' : 'batteries'} at once. You requested ${battery_quantity}.`
      );
      err.status = 422;
      throw err;
    }

    console.log(`[DEBUG] Battery swap request: ${battery_quantity}/${vehicleModel.battery_slot} batteries for ${vehicleModel.brand} ${vehicleModel.name}`);

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

    // Note: battery_cap đã bị loại bỏ trong database mới
    // Không còn giới hạn số lượng battery per swap theo plan
    // Giới hạn chỉ phụ thuộc vào available batteries tại station

    // 6. Check duplicate booking (WITH LOCK)
    await checkDuplicateBooking(driver_id, vehicle_id, scheduledTime, null, t);

    // 7. Find available batteries at station (WITH LOCK)
    const battery_type_id = vehicle.model.battery_type_id;
    
    let availableBatteries;
    try {
      console.log('[DEBUG] Searching for available batteries...', { station_id, battery_type_id, requested: battery_quantity });
      availableBatteries = await findAvailableBatteries(station_id, battery_type_id, scheduledTime, t);
      console.log('[DEBUG] Found batteries:', availableBatteries.length);
    } catch (error) {
      console.error('[ERROR] findAvailableBatteries failed:', error.message);
      console.error('[ERROR] Stack:', error.stack);
      throw error;
    }

    if (availableBatteries.length < battery_quantity) {
      const err = new Error(`Not enough available batteries at this station. Available: ${availableBatteries.length}, Requested: ${battery_quantity}`);
      err.status = 422;
      throw err;
    }

    // 9. Create booking (IN TRANSACTION)
    const newBooking = await Booking.create({
      driver_id,
      vehicle_id,
      station_id,
      scheduled_time: scheduledTime,
      status: 'pending' // Explicit set status (mặc dù model có defaultValue)
    }, { transaction: t });

    // 10. Select batteries and double-check availability (CONFLICT DETECTION)
    const selectedBatteries = availableBatteries.slice(0, battery_quantity);
    
    // Re-verify batteries are still available with lock
    const batteryIds = selectedBatteries.map(b => b.battery_id);
    const lockedBatteries = await Battery.findAll({
      where: {
        battery_id: { [Op.in]: batteryIds },
        current_soc: { [Op.gt]: 90 },
        current_soh: { [Op.gte]: 70 } // Pin phải có SOH >= 70% (đồng nhất với findAvailableBatteries)
      },
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (lockedBatteries.length < battery_quantity) {
      const err = new Error(`Battery availability changed during booking. Please try again. (Expected: ${battery_quantity}, Got: ${lockedBatteries.length})`);
      err.status = 409; // Conflict
      throw err;
    }

    console.log(`[DEBUG] Successfully locked ${lockedBatteries.length} batteries for booking`);

    // 11. Associate batteries with booking (IN TRANSACTION)
    const bookingBatteryPromises = lockedBatteries.map(battery => 
      BookingBattery.create({
        booking_id: newBooking.booking_id,
        battery_id: battery.battery_id
      }, { transaction: t })
    );
    
    await Promise.all(bookingBatteryPromises);

    // 12. Lock cabinet slots for reserved batteries (IN TRANSACTION)
    const batteryIdsToLock = lockedBatteries.map(b => b.battery_id);
    
    // Find slot_ids from batteries
    const slotIds = lockedBatteries
      .map(b => b.slot_id)
      .filter(id => id !== null && id !== undefined);
    
    if (slotIds.length > 0) {
      await CabinetSlot.update(
        { status: 'locked' },
        {
          where: {
            slot_id: { [Op.in]: slotIds }
          },
          transaction: t
        }
      );
      console.log(`[DEBUG] Successfully locked ${slotIds.length} cabinet slot(s) for booking`);
    }

    // 13. Return booking with full details (WITH TRANSACTION to read uncommitted data)
    // Transaction will commit here automatically if no errors
    return getBookingById(newBooking.booking_id, driver_id, t);
  });
}

/**
 * ========================================
 * GET BOOKINGS BY DRIVER
 * ========================================
 * Lấy tất cả bookings của driver với filter (KHÔNG PAGINATION)
 * 
 * @param {string} driver_id - ID của driver
 * @param {object} options - { status }
 * @returns {Promise<object>} - { bookings }
 */
async function getBookingsByDriver(driver_id, { status } = {}) {
  if (!driver_id) {
    const err = new Error('Driver ID is required');
    err.status = 400;
    throw err;
  }

  // Build where clause
  const where = { driver_id };
  
  // Add status filter if provided
  if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
    where.status = status;
  }

  const bookings = await Booking.findAll({
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
    order: [['scheduled_time', 'DESC']]
  });

  // Format all bookings to Vietnam timezone
  const formattedBookings = bookings.map(booking => formatBookingResponse(booking));

  return {
    bookings: formattedBookings,
    total: formattedBookings.length
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
 * @param {Transaction} t - Sequelize transaction (optional)
 * @returns {Promise<Booking>} - Booking details
 */
async function getBookingById(booking_id, driver_id = null, t = null) {
  if (!booking_id) {
    const err = new Error('Booking ID is required');
    err.status = 400;
    throw err;
  }

  const queryOptions = {
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
  };

  // Add transaction if provided
  if (t) {
    queryOptions.transaction = t;
  }

  const booking = await Booking.findByPk(booking_id, queryOptions);

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

  // Format datetime fields to Vietnam timezone
  return formatBookingResponse(booking);
}

/**
 * ========================================
 * UPDATE BOOKING
 * ========================================
 * Cập nhật thời gian booking
 * 
 * @param {string} booking_id - UUID của booking
 * @param {string} driver_id - ID của driver (để check ownership)
 * @param {object} updateData - { scheduled_time }
 * @returns {Promise<Booking>} - Updated booking
 */
async function updateBooking(booking_id, driver_id, { scheduled_time }) {
  if (!booking_id || !scheduled_time) {
    const err = new Error('Booking ID and scheduled time are required');
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
  if (new Date(booking.scheduled_time) < now) {
    const err = new Error('Cannot update a booking that has already started or passed');
    err.status = 422;
    throw err;
  }

  // 5. Check new time is valid
  const newScheduledTime = new Date(scheduled_time);
  
  // 6. Check duplicate with new time
  await checkDuplicateBooking(driver_id, booking.vehicle_id, newScheduledTime, booking_id);

  // 7. Calculate new end time
  const newEndTime = new Date(newScheduledTime);
  newEndTime.setMinutes(newEndTime.getMinutes() + 15);

  // 8. Update booking
  await booking.update({
    scheduled_time: newScheduledTime
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

  // 4. Update status to cancelled
  await booking.update({ status: 'cancelled' });

  // 5. Unlock cabinet slots based on battery SOC
  // Find all batteries reserved for this booking
  const bookingBatteries = await BookingBattery.findAll({
    where: { booking_id },
    include: [{
      model: Battery,
      as: 'battery',
      attributes: ['battery_id', 'slot_id', 'current_soc'],
      where: {
        slot_id: { [Op.not]: null } // Only batteries in cabinet slots
      }
    }]
  });

  // Update cabinet slot status based on SOC
  for (const bb of bookingBatteries) {
    const battery = bb.battery;
    if (battery && battery.slot_id) {
      const newStatus = battery.current_soc >= 100 ? 'charged' : 'charging';
      await CabinetSlot.update(
        { status: newStatus },
        { where: { slot_id: battery.slot_id } }
      );
    }
  }

  console.log(`[DEBUG] Unlocked ${bookingBatteries.length} cabinet slot(s) for cancelled booking ${booking_id}`);

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

  // Step 1: Find active subscription (WITH LOCK if transaction exists)
  const subscriptionQueryOptions = {
    where: {
      vehicle_id,
      cancel_time: null,
      end_date: { [Op.gte]: today }
    },
    attributes: ['subscription_id', 'plan_id', 'vehicle_id', 'start_date', 'end_date']
  };

  // Add transaction and lock ONLY for Subscription table (no JOIN)
  if (t) {
    subscriptionQueryOptions.lock = t.LOCK.UPDATE;
    subscriptionQueryOptions.transaction = t;
  }

  const activeSubscription = await Subscription.findOne(subscriptionQueryOptions);

  if (!activeSubscription) {
    const err = new Error('Vehicle does not have an active subscription. Please subscribe first.');
    err.status = 422;
    throw err;
  }

  // Step 2: Get plan details separately (NO LOCK needed for read-only reference data)
  const plan = await SubscriptionPlan.findByPk(activeSubscription.plan_id, {
    attributes: ['plan_id', 'plan_name', 'plan_fee', 'swap_fee', 'soh_cap'],
    transaction: t // Include in transaction but don't lock
  });

  if (!plan) {
    const err = new Error('Subscription plan not found');
    err.status = 500;
    throw err;
  }

  // Step 3: Attach plan to subscription object for consistent return format
  activeSubscription.plan = plan;

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

async function findAvailableBatteries(station_id, battery_type_id, datetime = null, t = null) {
  // 1. Tìm tất cả cabinets tại station (WITH LOCK if transaction)
  console.log('[findAvailableBatteries] Searching for cabinets at station:', station_id);
  
  let cabinets;
  try {
    const cabinetQueryOptions = {
      where: { 
        station_id,
        status: 'operational'
      },
      attributes: ['cabinet_id', 'station_id', 'cabinet_code']
    };

    // Add transaction and lock if provided (no include to avoid join lock)
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

  // 2. Lấy tất cả slots của các cabinets này (separate query, no lock)
  const cabinetIds = cabinets.map(c => c.cabinet_id);
  const slots = await CabinetSlot.findAll({
    where: {
      cabinet_id: { [Op.in]: cabinetIds },
      status: { [Op.in]: ['charging', 'charged'] }
    },
    attributes: ['slot_id', 'cabinet_id', 'status'],
    transaction: t
  });

  console.log('[findAvailableBatteries] Found slots:', slots.length);

  if (slots.length === 0) {
    return [];
  }

  // 3. Lấy tất cả slot_ids
  const slotIds = slots.map(s => s.slot_id);

  // 4. Tìm batteries trong các slots này (WITH LOCK if in transaction)
  // Note: Không dùng include với lock để tránh "FOR UPDATE on outer join" error
  const batteryQueryOptions = {
    where: {
      slot_id: { [Op.in]: slotIds },
      battery_type_id,
      current_soc: { [Op.gt]: 90 }, // Pin phải có hơn 90% SOC
      current_soh: { [Op.gte]: 70 } // Pin phải có SOH >= 70%
    }
  };

  // Add transaction and lock if provided
  if (t) {
    batteryQueryOptions.lock = t.LOCK.UPDATE;
    batteryQueryOptions.transaction = t;
  }

  const batteries = await Battery.findAll(batteryQueryOptions);

  // 4. Filter batteries by slot status 'charged' separately (avoid lock on join)
  const chargedBatteryIds = await CabinetSlot.findAll({
    where: {
      slot_id: { [Op.in]: batteries.map(b => b.slot_id) },
      status: 'charged'
    },
    attributes: ['slot_id'],
    transaction: t
  });

  const chargedSlotIds = new Set(chargedBatteryIds.map(s => s.slot_id));
  const availableBatteries = batteries.filter(b => chargedSlotIds.has(b.slot_id));

  // 5. Trả về tất cả batteries available
  // Miễn còn pin đủ điều kiện là được, hệ thống sẽ tự phân bổ
  return availableBatteries;
}

/**
 * ========================================
 * HELPER: CHECK DUPLICATE BOOKING
 * ========================================
 * Kiểm tra vehicle có booking pending khác không
 * 
 * BUSINESS RULE:
 * - Một VEHICLE chỉ được có TỐI ĐA 1 booking với status='pending' mỗi lúc
 * - Chỉ khi booking cũ đã completed hoặc cancelled thì vehicle đó mới được đặt booking mới
 * - Driver có thể có nhiều booking pending, NHƯNG mỗi xe chỉ 1 booking pending
 * 
 * VÍ DỤ:
 * - Driver A có 3 xe (Xe1, Xe2, Xe3)
 * - Xe1 có booking pending → Xe1 KHÔNG đặt được booking khác
 * - Xe1 có booking pending → Xe2, Xe3 VẪN đặt được (vì khác xe)
 * 
 * @param {string} driver_id - UUID của driver (không dùng để check)
 * @param {string} vehicle_id - UUID của vehicle (dùng để check)
 * @param {Date} scheduledTime - Thời gian booking (không dùng để check trùng nữa)
 * @param {string} excludeBookingId - Booking ID cần exclude (khi update)
 * @param {Transaction} t - Sequelize transaction (optional)
 * @throws {Error} - Nếu vehicle có pending booking khác
 */
async function checkDuplicateBooking(driver_id, vehicle_id, scheduledTime, excludeBookingId = null, t = null) {
  // CHỈ check vehicle có booking pending nào không
  // KHÔNG check driver vì driver có thể có nhiều xe, mỗi xe 1 booking pending
  const whereClause = {
    vehicle_id,  // ← CHỈ check vehicle_id, không check driver_id
    status: 'pending'
  };

  // Exclude booking hiện tại khi update
  if (excludeBookingId) {
    whereClause.booking_id = { [Op.ne]: excludeBookingId };
  }

  const queryOptions = {
    where: whereClause,
    attributes: ['booking_id', 'driver_id', 'vehicle_id', 'scheduled_time', 'status']
  };

  // Add transaction and lock if provided
  if (t) {
    queryOptions.lock = t.LOCK.UPDATE;
    queryOptions.transaction = t;
  }

  const existingPendingBooking = await Booking.findOne(queryOptions);

  if (existingPendingBooking) {
    const err = new Error(
      `Cannot create new booking. This vehicle already has a pending booking (ID: ${existingPendingBooking.booking_id}) scheduled at ${existingPendingBooking.scheduled_time}. Please complete or cancel the existing booking first.`
    );
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
      scheduled_time: {
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
