/**
 * BOOKING SERVICE
 * File: src/services/booking.service.js
 * 
 * Business logic layer xử lý các thao tác liên quan đến booking pin tại trạm swap.
 * Service này quản lý toàn bộ quy trình từ tạo booking, kiểm tra availability,
 * đến việc hủy booking và giải phóng resources.
 * 
 * Main Functions:
 * - createBooking: Tạo booking mới với battery matching
 * - getBookingsByDriver: Lấy danh sách bookings của driver
 * - getBookingById: Lấy chi tiết một booking cụ thể
 * - cancelBooking: Hủy booking và giải phóng slots
 * - checkAvailability: Kiểm tra số lượng pin available tại station
 * 
 * Helper Functions:
 * - findAvailableBatteries: Tìm pins sẵn sàng cho booking
 * - checkDuplicateBooking: Kiểm tra vehicle có booking pending khác
 * - checkVehicleSubscription: Validate subscription còn active
 * - formatToVietnamTime: Format datetime sang múi giờ Việt Nam
 * - formatBookingResponse: Format response với Vietnam timezone
 */

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
 * Format datetime sang múi giờ Việt Nam (UTC+7)
 * 
 * Chuyển đổi UTC datetime thành định dạng chuẩn Việt Nam để hiển thị
 * cho người dùng. Database lưu UTC, nhưng response trả về Vietnam time.
 * 
 * @param {Date|string} date - UTC date cần convert
 * @returns {string} Datetime string định dạng YYYY-MM-DD HH:mm:ss
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
 * Format booking response với Vietnam timezone
 * 
 * Convert tất cả datetime fields trong booking object sang múi giờ Việt Nam
 * trước khi trả về cho client. Đảm bảo người dùng thấy thời gian đúng với
 * khu vực của họ.
 * 
 * @param {Booking} booking - Booking object từ database
 * @returns {object} Booking object đã format với Vietnam timezone
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
  
  return bookingData;
}

/**
 * Tạo booking mới cho driver
 * 
 * Quy trình tạo booking gồm 15 bước:
 * 1. Validate input data (vehicle_id, station_id, battery_quantity)
 * 2. Lấy booking expiration interval từ system config
 * 3. Kiểm tra vehicle tồn tại và lấy thông tin model + battery type
 * 4. Validate battery_quantity không vượt quá vehicle capacity
 * 5. Kiểm tra quyền sở hữu vehicle (driver có sở hữu xe không)
 * 6. Kiểm tra station tồn tại và đang operational
 * 7. Kiểm tra vehicle có subscription active không
 * 8. Tính toán thời gian expired (hiện tại + interval từ config)
 * 9. Kiểm tra vehicle có booking pending nào khác không
 * 10. Tìm available batteries tại station (đúng loại, SOC >= 90%, SOH >= 70%)
 * 11. Tạo booking record với status pending
 * 12. Chọn batteries từ danh sách available
 * 13. Tạo associations trong bảng BookingBatteries
 * 14. Update cabinet slots từ occupied sang booked
 * 15. Return booking với đầy đủ thông tin relations
 * 
 * @param {string} driver_id - ID của driver (lấy từ JWT token)
 * @param {object} bookingData - Object chứa vehicle_id, station_id, battery_quantity
 * @returns {Promise<Booking>} Booking vừa tạo kèm đầy đủ relations
 * @throws {Error} Throw error với status code tương ứng nếu validation fail
 */
async function createBooking(driver_id, { vehicle_id, station_id, battery_quantity = 1 }) {
  // Step 1: Validate required fields
  if (!vehicle_id || !station_id) {
    const err = new Error('Vehicle ID and Station ID are required');
    err.statusCode = 400;
    throw err;
  }

  // Validate battery_quantity phải là số nguyên dương
  if (!Number.isInteger(battery_quantity) || battery_quantity < 1) {
    const err = new Error('Battery quantity must be a positive integer');
    err.statusCode = 400;
    throw err;
  }

  // Step 2: Lấy thời gian expiration từ system config
  const config = await Config.findOne({
    attributes: ['booking_expired_interval']
  });
  
  if (!config || !config.booking_expired_interval) {
    const err = new Error('System configuration not found');
    err.statusCode = 500;
    throw err;
  }
  
  const expirationIntervalMinutes = config.booking_expired_interval;
  console.log(`[DEBUG] Booking expiration interval: ${expirationIntervalMinutes} minutes`);

  // Step 3: Kiểm tra vehicle tồn tại và lấy thông tin cơ bản
  const vehicle = await Vehicle.findByPk(vehicle_id, {
    attributes: ['vehicle_id', 'driver_id', 'model_id', 'license_plate']
  });

  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.statusCode = 404;
    throw err;
  }

  // Lấy thông tin vehicle model và battery type
  const vehicleModel = await VehicleModel.findByPk(vehicle.model_id, {
    include: [{
      model: BatteryType,
      as: 'batteryType'
    }]
  });

  if (!vehicleModel || !vehicleModel.batteryType) {
    const err = new Error('Vehicle model or battery type not found');
    err.statusCode = 404;
    throw err;
  }

  // Gắn model vào vehicle object
  vehicle.model = vehicleModel;

  // Step 4: Validate battery_quantity không vượt quá vehicle capacity
  if (battery_quantity > vehicleModel.battery_slot) {
    const err = new Error(
      `This vehicle (${vehicleModel.brand} ${vehicleModel.name}) can only swap up to ${vehicleModel.battery_slot} ${vehicleModel.battery_slot === 1 ? 'battery' : 'batteries'} at once. You requested ${battery_quantity}.`
    );
    err.statusCode = 422;
    throw err;
  }

  console.log(`[DEBUG] Battery swap request: ${battery_quantity}/${vehicleModel.battery_slot} batteries for ${vehicleModel.brand} ${vehicleModel.name}`);

  // Step 5: Kiểm tra quyền sở hữu vehicle
  if (vehicle.driver_id !== driver_id) {
    const err = new Error('You do not own this vehicle');
    err.statusCode = 403;
    throw err;
  }

  // Step 6: Kiểm tra station tồn tại và đang operational
  const station = await Station.findOne({
    where: {
      station_id,
      status: 'operational'
    }
  });
  
  if (!station) {
    const err = new Error('Station not found or not operational');
    err.statusCode = 404;
    throw err;
  }

  // Step 7: Kiểm tra vehicle có subscription active không
  await checkVehicleSubscription(vehicle_id);

  // Note: Giới hạn số lượng pin chỉ phụ thuộc vào vehicle capacity
  // và số lượng pin available tại station, không giới hạn theo plan

  // Step 8: Tính toán thời gian expired
  const now = new Date();
  const expiredTime = new Date(now.getTime() + expirationIntervalMinutes * 60000);
  console.log(`[DEBUG] Booking will expire at: ${expiredTime.toISOString()}`);

  // Step 9: Kiểm tra vehicle có booking pending nào khác không
  await checkDuplicateBooking(driver_id, vehicle_id, null);

  // Step 10: Tìm available batteries tại station
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
    err.statusCode = 422;
    throw err;
  }

  // Step 11: Tạo booking record với status pending
  const newBooking = await Booking.create({
    driver_id,
    vehicle_id,
    station_id,
    expired_time: expiredTime,
    status: 'pending'
  });

  // Step 12: Chọn batteries từ danh sách available
  const selectedBatteries = availableBatteries.slice(0, battery_quantity);

  // Step 13: Tạo associations trong BookingBatteries
  const bookingBatteryPromises = selectedBatteries.map(battery => 
    BookingBattery.create({
      booking_id: newBooking.booking_id,
      battery_id: battery.battery_id
    })
  );
  
  await Promise.all(bookingBatteryPromises);

  // Step 14: Update cabinet slots từ occupied sang booked
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

  // Step 15: Return booking với đầy đủ relations
  return getBookingById(newBooking.booking_id, driver_id);
}

/**
 * Lấy danh sách bookings của driver
 * 
 * Trả về tất cả bookings của driver với option filter theo status.
 * Không có pagination, sắp xếp theo expired_time giảm dần (mới nhất trước).
 * Response đã được format sang múi giờ Việt Nam.
 * 
 * LAZY LOAD AUTO-CANCEL:
 * Trước khi query, hàm này tự động phát hiện và hủy các bookings pending đã expired
 * (expired_time < now). Điều này đảm bảo user luôn thấy data đã được cleanup mà không
 * cần đợi cron job chạy.
 * 
 * @param {string} driver_id - ID của driver
 * @param {object} options - Object chứa status filter (pending/completed/cancelled)
 * @returns {Promise<object>} Object chứa bookings array và total count
 */
async function getBookingsByDriver(driver_id, { status } = {}) {
  if (!driver_id) {
    const err = new Error('Driver ID is required');
    err.statusCode = 400;
    throw err;
  }

  // STEP 0: LAZY CLEANUP - Tự động hủy expired bookings
  const now = new Date();
  
  // Tìm tất cả bookings pending đã expired của driver
  const expiredBookings = await Booking.findAll({
    where: {
      driver_id,
      status: 'pending',
      expired_time: { [Op.lt]: now }
    },
    include: [{
      model: Battery,
      as: 'batteries',
      attributes: ['battery_id', 'slot_id', 'current_soh'],
      through: { attributes: [] }
    }]
  });

  // Auto-cancel từng expired booking
  if (expiredBookings.length > 0) {
    console.log(`[LAZY-CLEANUP] Found ${expiredBookings.length} expired booking(s) for driver ${driver_id}`);
    
    for (const booking of expiredBookings) {
      try {
        // Update booking status sang cancelled
        await booking.update({ status: 'cancelled' });
        
        // Unlock cabinet slots dựa trên SOH của battery
        const batteries = booking.batteries || [];
        for (const battery of batteries) {
          if (battery.slot_id) {
            // SOH >= 70%: occupied (sẵn sàng), SOH < 70%: locked (cần bảo trì)
            const newStatus = battery.current_soh >= 70 ? 'occupied' : 'locked';
            await CabinetSlot.update(
              { status: newStatus },
              { where: { slot_id: battery.slot_id } }
            );
          }
        }
        
        console.log(`[LAZY-CLEANUP] Auto-cancelled booking ${booking.booking_id} (expired at ${booking.expired_time})`);
      } catch (error) {
        console.error(`[LAZY-CLEANUP] Failed to cancel booking ${booking.booking_id}:`, error.message);
        // Tiếp tục cancel các bookings khác nếu 1 booking fail
      }
    }
  }

  // STEP 1: Xây dựng where clause với filter status từ user
  const where = { driver_id };
  
  // Thêm filter status nếu được cung cấp
  if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
    where.status = status;
  }

  // STEP 2: Query bookings (lúc này expired bookings đã được cancel)
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
        through: { attributes: [] } // Loại bỏ attributes của bảng BookingBatteries
      }
    ],
    order: [['expired_time', 'DESC']]
  });

  // STEP 3: Format tất cả datetime fields sang múi giờ Việt Nam
  const formattedBookings = bookings.map(booking => formatBookingResponse(booking));

  return {
    bookings: formattedBookings,
    total: formattedBookings.length
  };
}

/**
 * Lấy chi tiết booking theo ID
 * 
 * Trả về booking với đầy đủ thông tin relations:
 * - Driver info (account, fullname, email, phone)
 * - Vehicle info (model, battery type)
 * - Station info (name, address, coordinates)
 * - Batteries info (serial, SOC, SOH)
 * 
 * Kiểm tra quyền sở hữu nếu driver_id được cung cấp.
 * Response đã được format sang múi giờ Việt Nam.
 * 
 * @param {string} booking_id - UUID của booking cần lấy
 * @param {string} driver_id - ID của driver để check ownership (optional)
 * @returns {Promise<Booking>} Booking object với đầy đủ relations
 */
async function getBookingById(booking_id, driver_id = null) {
  if (!booking_id) {
    const err = new Error('Booking ID is required');
    err.statusCode = 400;
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
    err.statusCode = 404;
    throw err;
  }

  // Kiểm tra quyền sở hữu nếu driver_id được cung cấp
  if (driver_id && booking.driver_id !== driver_id) {
    const err = new Error('You do not have permission to view this booking');
    err.statusCode = 403;
    throw err;
  }

  // Format datetime fields to Vietnam timezone
  return formatBookingResponse(booking);
}

/**
 * Hủy booking
 * 
 * Cancel booking bằng cách update status sang cancelled và giải phóng
 * cabinet slots để pins có thể được book lại.
 * 
 * Logic giải phóng slots:
 * - Nếu battery SOH > 70%: slot chuyển sang occupied (sẵn sàng book lại)
 * - Nếu battery SOH <= 70%: slot chuyển sang locked (cần bảo trì)
 * 
 * Chỉ owner của booking mới có quyền cancel. Chỉ cancel được booking
 * có status pending.
 * 
 * @param {string} booking_id - UUID của booking cần cancel
 * @param {string} driver_id - ID của driver để check ownership
 * @returns {Promise<object>} Object chứa success message và booking_id
 */
async function cancelBooking(booking_id, driver_id) {
  if (!booking_id) {
    const err = new Error('Booking ID is required');
    err.statusCode = 400;
    throw err;
  }

  // Step 1: Tìm booking
  const booking = await Booking.findByPk(booking_id);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Check ownership
  if (booking.driver_id !== driver_id) {
    const err = new Error('You do not have permission to cancel this booking');
    err.statusCode = 403;
    throw err;
  }

  // Step 3: Kiểm tra status phải là pending
  if (booking.status !== 'pending') {
    const err = new Error(`Cannot cancel booking with status '${booking.status}'. Only pending bookings can be cancelled.`);
    err.statusCode = 422;
    throw err;
  }

  // Step 4: Update status sang cancelled
  await booking.update({ status: 'cancelled' });

  // Step 5: Giải phóng cabinet slots dựa trên SOH của battery
  // Lấy tất cả batteries được reserve cho booking này
  const bookingBatteries = await BookingBattery.findAll({
    where: { booking_id },
    include: [{
      model: Battery,
      as: 'battery',
      attributes: ['battery_id', 'slot_id', 'current_soc', 'current_soh'],
      where: {
        slot_id: { [Op.not]: null } // Chỉ lấy batteries trong cabinet
      }
    }]
  });

  // Update slot status dựa trên SOH của battery
  for (const bb of bookingBatteries) {
    const battery = bb.battery;
    if (battery && battery.slot_id) {
      // SOH >= 70%: occupied (sẵn sàng), SOH < 70%: locked (cần bảo trì)
      const newStatus = battery.current_soh >= 70 ? 'occupied' : 'locked';
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
 * Kiểm tra vehicle có subscription active
 * 
 * Validate vehicle có subscription còn hiệu lực không trước khi cho phép booking.
 * Subscription phải:
 * - Chưa bị cancel (cancel_time = null)
 * - Chưa hết hạn (end_date >= hôm nay)
 * 
 * @param {string} vehicle_id - UUID của vehicle cần kiểm tra
 * @returns {Promise<void>} Không return gì, chỉ throw error nếu không có subscription
 * @throws {Error} Throw error nếu vehicle không có subscription active
 */
async function checkVehicleSubscription(vehicle_id) {
  const today = new Date().toISOString().split('T')[0];

  // Tìm active subscription
  const activeSubscription = await Subscription.findOne({
    where: {
      vehicle_id,
      cancel_time: null,
      end_date: { [Op.gte]: today }
    },
    attributes: ['subscription_id'] // Chỉ cần check tồn tại, không cần details
  });

  if (!activeSubscription) {
    const err = new Error('Vehicle does not have an active subscription. Please subscribe first.');
    err.statusCode = 422;
    throw err;
  }

  // Không cần return, chỉ cần validate
}

/**
 * Tìm available batteries tại station
 * 
 * Quy trình tìm batteries:
 * 1. Tìm cabinets operational tại station
 * 2. Lấy slots có status occupied (có pin sẵn sàng, chưa bị book)
 * 3. Filter batteries theo điều kiện:
 *    - Đúng battery_type_id
 *    - SOC >= 90% (đủ năng lượng)
 *    - SOH >= 70% (pin còn tốt)
 * 
 * Slot status giải thích:
 * - occupied: Có pin sẵn sàng (SOH > 70%), có thể booking
 * - booked: Có pin nhưng đang bị giữ bởi booking pending khác
 * - locked: Có pin nhưng SOH <= 70%, cần bảo trì
 * - empty: Không có pin
 * 
 * @param {number} station_id - ID của station cần tìm batteries
 * @param {number} battery_type_id - ID loại pin cần tìm
 * @returns {Promise<Battery[]>} Array các battery objects thỏa mãn điều kiện
 */
async function findAvailableBatteries(station_id, battery_type_id) {
  // Step 1: Tìm tất cả cabinets operational tại station
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

  // Step 2: Lấy slots có status occupied (pin sẵn sàng booking)
  // Loại trừ: empty (không pin), locked (SOH thấp), booked (đang giữ)
  const cabinetIds = cabinets.map(c => c.cabinet_id);
  const slots = await CabinetSlot.findAll({
    where: {
      cabinet_id: { [Op.in]: cabinetIds },
      status: 'occupied'
    },
    attributes: ['slot_id', 'cabinet_id', 'status']
  });

  console.log('[findAvailableBatteries] Found slots with status occupied:', slots.length);

  if (slots.length === 0) {
    return [];
  }

  // Step 3: Extract slot IDs
  const slotIds = slots.map(s => s.slot_id);

  // Step 4: Tìm batteries thỏa mãn tất cả điều kiện
  const availableBatteries = await Battery.findAll({
    where: {
      slot_id: { [Op.in]: slotIds },
      battery_type_id,
      current_soc: { [Op.gte]: 90 },  // Đủ năng lượng
      current_soh: { [Op.gte]: 70 }   // Pin còn tốt
    }
  });

  console.log('[findAvailableBatteries] Found batteries matching criteria:', availableBatteries.length);

  // Step 5: Return danh sách batteries available
  return availableBatteries;
}

/**
 * Kiểm tra vehicle có booking pending khác
 * 
 * Business Rule: Mỗi vehicle chỉ được có tối đa 1 booking pending CHƯA EXPIRED cùng lúc.
 * Phải cancel hoặc complete booking cũ, hoặc đợi booking cũ expired trước khi tạo booking mới.
 * 
 * Lưu ý:
 * - Rule áp dụng cho VEHICLE, không phải DRIVER
 * - Chỉ check bookings với expired_time > now (chưa hết hạn)
 * - Bookings đã expired sẽ được cron job tự động cancel
 * - Cho phép user tạo booking mới ngay khi booking cũ expired, không cần đợi job
 * 
 * Ví dụ:
 * - Driver A có 3 xe: Xe1, Xe2, Xe3
 * - Xe1 có booking pending chưa expired -> Xe1 không thể tạo booking mới
 * - Xe1 có booking pending đã expired -> Xe1 TẠO ĐƯỢC booking mới
 * - Xe2, Xe3 vẫn tạo được booking (vì khác xe)
 * 
 * @param {string} driver_id - ID của driver (không dùng để validate)
 * @param {string} vehicle_id - ID của vehicle cần kiểm tra
 * @param {string} excludeBookingId - Booking ID cần bỏ qua khi check (dùng cho update)
 * @throws {Error} Throw error nếu vehicle đã có booking pending chưa expired
 */
async function checkDuplicateBooking(driver_id, vehicle_id, excludeBookingId = null) {
  const now = new Date();
  
  // Chỉ check vehicle_id, không check driver_id
  // Chỉ check bookings chưa expired (expired_time > now)
  const whereClause = {
    vehicle_id,
    status: 'pending',
    expired_time: { [Op.gt]: now }  // Chỉ check bookings chưa hết hạn
  };

  // Loại trừ booking hiện tại (dùng cho update)
  if (excludeBookingId) {
    whereClause.booking_id = { [Op.ne]: excludeBookingId };
  }

  const existingPendingBooking = await Booking.findOne({
    where: whereClause,
    attributes: ['booking_id', 'driver_id', 'vehicle_id', 'expired_time', 'status']
  });

  if (existingPendingBooking) {
    const expiresAt = formatToVietnamTime(existingPendingBooking.expired_time);
    const err = new Error(
      `Cannot create new booking. This vehicle already has a pending booking (ID: ${existingPendingBooking.booking_id}) that expires at ${expiresAt}. Please complete or cancel the existing booking first.`
    );
    err.statusCode = 409;
    throw err;
  }
}

/**
 * Kiểm tra availability của pin tại station
 * 
 * Check xem station có đủ pins sẵn sàng cho vehicle này không.
 * Trả về số lượng pins available và thông tin chi tiết về station.
 * 
 * Flow xử lý:
 * 1. Validate station tồn tại và đang operational
 * 2. Lấy thông tin vehicle để xác định battery_type cần thiết
 * 3. Tìm tất cả batteries sẵn sàng: đúng loại, SOC >= 90%, SOH >= 70%, status = occupied
 * 4. Đếm tổng số pins loại này tại station (tất cả status: occupied/booked/locked)
 * 5. Đếm tổng capacity của station (total slots)
 * 6. Return availability info với message thân thiện
 * 
 * Response bao gồm:
 * - available_batteries: Số pins có thể book ngay (SOC>=90%, SOH>=70%, occupied)
 * - total_batteries_of_type: Tổng số pins loại này tại station (bất kể status)
 * - total_slots: Tổng số slots tại station
 * 
 * Lưu ý: Không xử lý race condition (2 users book cùng lúc).
 * Backend createBooking sẽ handle first-come-first-served.
 * 
 * @param {number} station_id - ID của station cần kiểm tra
 * @param {string} vehicle_id - UUID của vehicle (để xác định loại pin cần)
 * @returns {Promise<object>} Object chứa availability status và details
 * @throws {Error} Throw 404 nếu station hoặc vehicle không tồn tại
 * 
 * @example
 * const result = await checkAvailability(1, "abc-123");
 * // {
 * //   available: true,
 * //   message: "Station has 10 available BT001 batteries",
 * //   station: { station_id, station_name, address, status },
 * //   battery_type: { battery_type_id, battery_type_code },
 * //   availability_details: {
 * //     available_batteries: 10,        // Pins sẵn sàng book
 * //     total_batteries_of_type: 25,    // Tổng pins loại này (kể cả booked/locked)
 * //     total_slots: 50,                // Tổng slots
 * //     station_status: "operational"
 * //   }
 * // }
 */
async function checkAvailability(station_id, vehicle_id) {
  // Step 1: Validate station tồn tại và kiểm tra status
  const station = await Station.findByPk(station_id);
  
  if (!station) {
    const err = new Error('Station not found');
    err.statusCode = 404;
    throw err;
  }

  // Return sớm nếu station không operational
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

  // Step 2: Lấy vehicle info và xác định battery_type cần thiết
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
    err.statusCode = 404;
    throw err;
  }

  // Extract battery type info
  const battery_type_id = vehicle.model.battery_type_id;
  const battery_type_code = vehicle.model.batteryType.battery_type_code;

  // Step 3: Tìm available batteries tại station
  // Điều kiện: đúng loại, SOC >= 90%, SOH >= 70%, slot occupied
  const availableBatteries = await findAvailableBatteries(station_id, battery_type_id);

  // Step 4: Đếm tổng số pins loại này tại station (không phân biệt status)
  // Lấy tất cả batteries đúng loại, bất kể occupied/booked/locked
  const totalBatteriesOfType = await Battery.count({
    where: {
      battery_type_id,
      slot_id: { [Op.not]: null } // Chỉ đếm batteries đang trong cabinet
    },
    include: [{
      model: CabinetSlot,
      as: 'cabinetSlot',
      required: true,
      include: [{
        model: Cabinet,
        as: 'cabinet',
        where: { station_id },
        required: true
      }]
    }]
  });

  // Step 5: Đếm tổng capacity của station (tất cả slots)
  const totalSlots = await CabinetSlot.count({
    include: [{
      model: Cabinet,
      as: 'cabinet',
      where: { station_id }
    }]
  });

  // Step 6: Xác định availability
  // Logic đơn giản: có ít nhất 1 pin available là OK
  const isAvailable = availableBatteries.length > 0;

  // Step 7: Format response và return
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
      available_batteries: availableBatteries.length,     // Số pin sẵn sàng book ngay (SOC>=90%, SOH>=70%, status=occupied)
      total_batteries_of_type: totalBatteriesOfType,      // Tổng số pins loại này tại station (bất kể status: occupied/booked/locked)
      total_slots: totalSlots,                            // Tổng số slots tại station (kể cả empty)
      station_status: station.status                      // Status hiện tại của station
    }
  };
}

module.exports = {
  createBooking,
  getBookingsByDriver,
  getBookingById,
  cancelBooking,
  checkAvailability
};
