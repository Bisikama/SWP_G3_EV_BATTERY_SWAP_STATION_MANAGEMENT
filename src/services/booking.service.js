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
  Config,
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
  if (bookingData.expired_time) {
    bookingData.expired_time = formatToVietnamTime(bookingData.expired_time);
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
 * @param {object} bookingData - { vehicle_id, station_id, battery_quantity }
 * @returns {Promise<Booking>} - Booking vừa tạo (kèm relations)
 * @throws {Error} - Lỗi với status code
 */
async function createBooking(driver_id, { vehicle_id, station_id, battery_quantity = 1 }) {
  // 1. Validate required fields
  if (!vehicle_id || !station_id) {
    const err = new Error('Vehicle ID and Station ID are required');
    err.status = 400;
    throw err;
  }

  // Validate battery_quantity
  if (!Number.isInteger(battery_quantity) || battery_quantity < 1) {
    const err = new Error('Battery quantity must be a positive integer');
    err.status = 400;
    throw err;
  }

  // 2. Get booking expiration interval from config
  const config = await Config.findOne({
    attributes: ['booking_expired_interval']
  });
  
  if (!config || !config.booking_expired_interval) {
    const err = new Error('System configuration not found');
    err.status = 500;
    throw err;
  }
  
  const expirationIntervalMinutes = config.booking_expired_interval;
  console.log(`[DEBUG] Booking expiration interval: ${expirationIntervalMinutes} minutes`);

  // 3. Check vehicle exists
  const vehicle = await Vehicle.findByPk(vehicle_id, {
    attributes: ['vehicle_id', 'driver_id', 'model_id', 'license_plate']
  });

  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  // Get vehicle model and battery type separately
  const vehicleModel = await VehicleModel.findByPk(vehicle.model_id, {
    include: [{
      model: BatteryType,
      as: 'batteryType'
    }]
  });

  if (!vehicleModel || !vehicleModel.batteryType) {
    const err = new Error('Vehicle model or battery type not found');
    err.status = 404;
    throw err;
  }

  // Attach model to vehicle for consistent object structure
  vehicle.model = vehicleModel;

  // 4. Validate battery_quantity against vehicle's battery_slot capacity
  if (battery_quantity > vehicleModel.battery_slot) {
    const err = new Error(
      `This vehicle (${vehicleModel.brand} ${vehicleModel.name}) can only swap up to ${vehicleModel.battery_slot} ${vehicleModel.battery_slot === 1 ? 'battery' : 'batteries'} at once. You requested ${battery_quantity}.`
    );
    err.status = 422;
    throw err;
  }

  console.log(`[DEBUG] Battery swap request: ${battery_quantity}/${vehicleModel.battery_slot} batteries for ${vehicleModel.brand} ${vehicleModel.name}`);

  // 5. Check vehicle ownership
  if (vehicle.driver_id !== driver_id) {
    const err = new Error('You do not own this vehicle');
    err.status = 403;
    throw err;
  }

  // 6. Check station exists and operational
  const station = await Station.findOne({
    where: {
      station_id,
      status: 'operational'
    }
  });
  
  if (!station) {
    const err = new Error('Station not found or not operational');
    err.status = 404;
    throw err;
  }

  // 7. Check vehicle has active subscription
  const activeSubscription = await checkVehicleSubscription(vehicle_id);

  // Note: battery_cap đã bị loại bỏ trong database mới
  // Không còn giới hạn số lượng battery per swap theo plan
  // Giới hạn chỉ phụ thuộc vào available batteries tại station

  // 8. Calculate expired_time = create_time + booking_expired_interval
  const now = new Date();
  const expiredTime = new Date(now.getTime() + expirationIntervalMinutes * 60000);
  console.log(`[DEBUG] Booking will expire at: ${expiredTime.toISOString()}`);

  // 9. Check duplicate booking
  await checkDuplicateBooking(driver_id, vehicle_id, null);

  // 10. Find available batteries at station
  const battery_type_id = vehicle.model.battery_type_id;
  
  let availableBatteries;
  try {
    console.log('[DEBUG] Searching for available batteries...', { station_id, battery_type_id, requested: battery_quantity });
    availableBatteries = await findAvailableBatteries(station_id, battery_type_id);
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

  // 11. Create booking with expired_time
  const newBooking = await Booking.create({
    driver_id,
    vehicle_id,
    station_id,
    expired_time: expiredTime,
    status: 'pending'
  });

  // 12. Select batteries
  const selectedBatteries = availableBatteries.slice(0, battery_quantity);

  // 13. Associate batteries with booking
  const bookingBatteryPromises = selectedBatteries.map(battery => 
    BookingBattery.create({
      booking_id: newBooking.booking_id,
      battery_id: battery.battery_id
    })
  );
  
  await Promise.all(bookingBatteryPromises);

  // 14. Book cabinet slots for reserved batteries (occupied → booked)
  const slotIds = selectedBatteries
    .map(b => b.slot_id)
    .filter(id => id !== null && id !== undefined);
  
  if (slotIds.length > 0) {
    await CabinetSlot.update(
      { status: 'booked' },
      {
        where: {
          slot_id: { [Op.in]: slotIds }
        }
      }
    );
    console.log(`[DEBUG] Successfully booked ${slotIds.length} cabinet slot(s) for booking`);
  }

  // 15. Return booking with full details
  return getBookingById(newBooking.booking_id, driver_id);
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
    order: [['expired_time', 'DESC']]
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

  // Format datetime fields to Vietnam timezone
  return formatBookingResponse(booking);
}

/**
 * ========================================
 * UPDATE BOOKING
 * ========================================
 * NOTE: With auto-expiration, bookings cannot be rescheduled.
 * This function is deprecated but kept for backward compatibility.
 * 
 * @param {string} booking_id - UUID của booking
 * @param {string} driver_id - ID của driver (để check ownership)
 * @param {object} updateData - Reserved for future use
 * @returns {Promise<Booking>} - Updated booking
 */
async function updateBooking(booking_id, driver_id, updateData = {}) {
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

  // 4. Check booking hasn't expired
  const now = new Date();
  if (new Date(booking.expired_time) < now) {
    const err = new Error('Cannot update a booking that has already expired');
    err.status = 422;
    throw err;
  }

  // 5. Since booking time is now auto-calculated, there's nothing to update
  // This endpoint is kept for backward compatibility but does not allow rescheduling
  const err = new Error('Booking times are now automatically managed and cannot be changed. Please cancel and create a new booking if needed.');
  err.status = 422;
  throw err;
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

  // 5. Unlock cabinet slots: booked → occupied (if SOH > 70%) or locked (if SOH ≤ 70%)
  // Find all batteries reserved for this booking
  const bookingBatteries = await BookingBattery.findAll({
    where: { booking_id },
    include: [{
      model: Battery,
      as: 'battery',
      attributes: ['battery_id', 'slot_id', 'current_soc', 'current_soh'],
      where: {
        slot_id: { [Op.not]: null } // Only batteries in cabinet slots
      }
    }]
  });

  // Update cabinet slot status based on battery SOH
  for (const bb of bookingBatteries) {
    const battery = bb.battery;
    if (battery && battery.slot_id) {
      // Logic: SOH > 70% → 'occupied' (sẵn sàng), SOH ≤ 70% → 'locked' (không cho booking)
      const newStatus = battery.current_soh > 70 ? 'occupied' : 'locked';
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
 * @throws {Error} - Nếu không có subscription active
 */
async function checkVehicleSubscription(vehicle_id) {
  const today = new Date().toISOString().split('T')[0];

  // Step 1: Find active subscription
  const activeSubscription = await Subscription.findOne({
    where: {
      vehicle_id,
      cancel_time: null,
      end_date: { [Op.gte]: today }
    },
    attributes: ['subscription_id', 'plan_id', 'vehicle_id', 'start_date', 'end_date']
  });

  if (!activeSubscription) {
    const err = new Error('Vehicle does not have an active subscription. Please subscribe first.');
    err.status = 422;
    throw err;
  }

  // Step 2: Get plan details separately
  const plan = await SubscriptionPlan.findByPk(activeSubscription.plan_id, {
    attributes: ['plan_id', 'plan_name', 'plan_fee', 'swap_fee', 'soh_cap']
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
 * Tìm batteries available tại station cho battery swap
 * 
 * ĐIỀU KIỆN AVAILABLE:
 * 1. Cabinet status = 'operational'
 * 2. Slot status = 'occupied' (có pin, SOH > 70%, chưa booked)
 * 3. Battery type khớp với vehicle
 * 4. Battery SOC >= 90% (đủ năng lượng)
 * 5. Battery SOH >= 70% (pin còn tốt)
 * 6. Battery trong cabinet (slot_id NOT NULL, vehicle_id = NULL)
 * 
 * NOTE: Không check booking conflicts (không xử lý race condition)
 * 
 * @param {number} station_id - ID của station
 * @param {number} battery_type_id - ID loại pin cần tìm
 * @returns {Promise<Battery[]>} Danh sách batteries available
 * 
 * @example
 * const batteries = await findAvailableBatteries(1, 2);
 * // Returns: [Battery{ battery_id, slot_id, current_soc: 95, current_soh: 85 }, ...]
 */
async function findAvailableBatteries(station_id, battery_type_id) {
  // 1. Tìm tất cả cabinets tại station
  console.log('[findAvailableBatteries] Searching for cabinets at station:', station_id);
  
  let cabinets;
  try {
    cabinets = await Cabinet.findAll({
      where: { 
        station_id,
        status: 'operational'
      },
      attributes: ['cabinet_id', 'station_id', 'cabinet_code']
    });
    console.log('[findAvailableBatteries] Found cabinets:', cabinets.length);
  } catch (error) {
    console.error('[ERROR] Cabinet query failed:', error.message);
    throw error;
  }

  if (cabinets.length === 0) {
    return [];
  }

  // 2. Lấy tất cả slots của các cabinets này
  // ✅ Chỉ lấy slot 'occupied' (có pin sẵn sàng, SOH > 70%), loại trừ 'locked', 'empty', 'booked'
  const cabinetIds = cabinets.map(c => c.cabinet_id);
  const slots = await CabinetSlot.findAll({
    where: {
      cabinet_id: { [Op.in]: cabinetIds },
      status: 'occupied'  // Chỉ lấy slot có pin sẵn sàng (SOH > 70%)
    },
    attributes: ['slot_id', 'cabinet_id', 'status']
  });

  console.log('[findAvailableBatteries] Found slots with status occupied:', slots.length);

  if (slots.length === 0) {
    return [];
  }

  // 3. Lấy tất cả slot_ids
  const slotIds = slots.map(s => s.slot_id);

  // 4. Tìm batteries trong các slots này
  // ✅ QUAN TRỌNG: Battery.current_soc là source of truth, không cần check slot status nữa
  const availableBatteries = await Battery.findAll({
    where: {
      slot_id: { [Op.in]: slotIds },
      battery_type_id,
      current_soc: { [Op.gte]: 90 },  // ✅ SOURCE OF TRUTH: SOC >= 90%
      current_soh: { [Op.gte]: 70 }   // Pin phải có SOH >= 70%
    }
  });

  console.log('[findAvailableBatteries] Found batteries matching criteria:', availableBatteries.length);

  // 5. Trả về tất cả batteries available
  // Pin có SOC >= 90% và SOH >= 70% trong slot 'occupied' (sẵn sàng cho booking)
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
 * @param {string} excludeBookingId - Booking ID cần exclude (khi update)
 * @throws {Error} - Nếu vehicle có pending booking khác
 */
async function checkDuplicateBooking(driver_id, vehicle_id, excludeBookingId = null) {
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

  const existingPendingBooking = await Booking.findOne({
    where: whereClause,
    attributes: ['booking_id', 'driver_id', 'vehicle_id', 'expired_time', 'status']
  });

  if (existingPendingBooking) {
    const err = new Error(
      `Cannot create new booking. This vehicle already has a pending booking (ID: ${existingPendingBooking.booking_id}) that expires at ${existingPendingBooking.expired_time}. Please complete or cancel the existing booking first.`
    );
    err.status = 409;
    throw err;
  }
}

/**
 * ========================================
 * CHECK AVAILABILITY
 * ========================================
 * Kiểm tra tính khả dụng của pin tại station cho một vehicle cụ thể
 * 
 * FLOW:
 * 1. Validate station tồn tại và operational
 * 2. Lấy thông tin vehicle và battery_type cần thiết
 * 3. Tìm tất cả batteries available tại station (SOC>=90%, SOH>=70%)
 * 4. Đếm tổng số slots tại station
 * 5. Return availability info
 * 
 * NOTE: Không xử lý race condition (2 users đặt cùng lúc)
 *       Backend createBooking sẽ handle first-come-first-served
 * 
 * @param {number} station_id - ID của station cần check
 * @param {string} vehicle_id - UUID của vehicle (để xác định battery_type_id)
 * @returns {Promise<object>} Availability info với details
 * @throws {Error} 404 nếu station hoặc vehicle không tồn tại
 * 
 * @example
 * const result = await checkAvailability(1, "abc-123");
 * // Returns:
 * // {
 * //   available: true,
 * //   message: "Station has 10 available BT001 batteries",
 * //   station: {...},
 * //   battery_type: {...},
 * //   availability_details: {
 * //     available_batteries: 10,
 * //     total_slots: 50,
 * //     station_status: "operational"
 * //   }
 * // }
 */
async function checkAvailability(station_id, vehicle_id) {
  // ============================================================
  // STEP 1: Validate station tồn tại và kiểm tra trạng thái
  // ============================================================
  const station = await Station.findByPk(station_id);
  
  if (!station) {
    const err = new Error('Station not found');
    err.status = 404;
    throw err;
  }

  // Early return nếu station không operational
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

  // ============================================================
  // STEP 2: Lấy vehicle info và xác định battery_type cần thiết
  // ============================================================
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

  // Extract battery type info cho xe này
  const battery_type_id = vehicle.model.battery_type_id;
  const battery_type_code = vehicle.model.batteryType.battery_type_code;

  // ============================================================
  // STEP 3: Tìm tất cả batteries available tại station
  // ============================================================
  // Điều kiện: SOC >= 90%, SOH >= 70%, đúng battery_type, trong slot 'occupied'
  const availableBatteries = await findAvailableBatteries(station_id, battery_type_id);

  // ============================================================
  // STEP 4: Đếm tổng capacity của station
  // ============================================================
  const totalSlots = await CabinetSlot.count({
    include: [{
      model: Cabinet,
      as: 'cabinet',
      where: { station_id }
    }]
  });

  // ============================================================
  // STEP 5: Xác định availability (simple check)
  // ============================================================
  // Logic đơn giản: Có >= 1 pin available → TRUE
  // NOTE: Không trừ đi pins đang bị booking pending giữ (không xử lý race condition)
  const isAvailable = availableBatteries.length > 0;

  // ============================================================
  // STEP 6: Format và return response
  // ============================================================
  return {
    available: isAvailable,
    message: isAvailable 
      ? `Station has ${availableBatteries.length} available ${battery_type_code} batteries` 
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
      available_batteries: availableBatteries.length,  // Số pin thỏa mãn: SOC>=90%, SOH>=70%, đúng loại
      total_slots: totalSlots,                        // Tổng số slots tại station
      station_status: station.status                   // Trạng thái hiện tại của station
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
