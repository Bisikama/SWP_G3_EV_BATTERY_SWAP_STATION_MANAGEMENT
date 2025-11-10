/**
 * BOOKING CONTROLLER
 * File: src/controllers/booking.controller.js
 * 
 * HTTP request/response handler cho booking operations.
 * Thin controller pattern - chỉ xử lý HTTP layer, không chứa business logic.
 * 
 * Responsibilities:
 * - Extract và validate data từ request (body, params, query, headers)
 * - Gọi service methods để xử lý business logic
 * - Format response trả về cho client
 * - Error handling tự động thông qua asyncHandler middleware
 * 
 * Business logic được xử lý trong booking.service.js
 */

'use strict';
const bookingService = require('../services/booking.service');
const asyncHandler = require('../middlewares/asyncHandler');
/**
 * Tạo booking mới
 * 
 * Endpoint: POST /api/booking
 * Access: Private (driver only)
 * 
 * Body params:
 * - vehicle_id: UUID của vehicle
 * - station_id: ID của station
 * - battery_quantity: Số lượng pin cần swap (default: 1)
 * 
 * Thời gian expired được tự động tính từ system config.
 */
const createBooking = asyncHandler(async (req, res) => {
  const { vehicle_id, station_id, battery_quantity } = req.body;
  const driver_id = req.user.account_id;

  const booking = await bookingService.createBooking(driver_id, {
    vehicle_id,
    station_id,
    battery_quantity: battery_quantity || 1 // Mặc định 1 pin nếu không cung cấp
  });

  return res.status(201).json({
    message: 'Booking created successfully',
    booking
  });
});

/**
 * Lấy danh sách bookings của driver
 * 
 * Endpoint: GET /api/booking/my-bookings
 * Access: Private (driver)
 * 
 * Query params:
 * - status: Filter theo status (pending/completed/cancelled) - optional
 * 
 * Lưu ý: Không có pagination, trả về toàn bộ bookings của driver.
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const driver_id = req.user.account_id;
  const { status } = req.query;

  const result = await bookingService.getBookingsByDriver(driver_id, {
    status
  });

  return res.status(200).json({
    message: 'Bookings retrieved successfully',
    total: result.total,
    bookings: result.bookings
  });
});

/**
 * Lấy chi tiết booking theo ID
 * 
 * Endpoint: GET /api/booking/:id
 * Access: Public (không cần token) - cho kiosk/station hardware
 * 
 * Path params:
 * - id: UUID của booking
 * 
 * Authorization logic:
 * - Có token + role driver: Chỉ xem được booking của mình
 * - Có token + role admin: Xem được tất cả bookings
 * - Không có token: Xem được bất kỳ booking nào (cho kiosk)
 */
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check ownership nếu có token, cho phép access mọi booking nếu không có token
  let ownerDriverId = null;
  if (req.user) {
    const driver_id = req.user.account_id;
    const role = req.user.role;
    ownerDriverId = role !== 'admin' ? driver_id : null;
  }

  const booking = await bookingService.getBookingById(id, ownerDriverId);

  return res.status(200).json({
    message: 'Booking retrieved successfully',
    booking
  });
});

/**
 * Update booking (DEPRECATED)
 * 
 * Endpoint: PATCH /api/booking/:id
 * Access: Private (driver only - owner)
 * 
 * Path params:
 * - id: UUID của booking
 * 
 * Status: DEPRECATED
 * Reason: Booking times được tự động quản lý bởi system config.
 * Action: Sẽ luôn throw error, driver cần cancel và tạo booking mới.
 */
const updateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driver_id = req.user.account_id;

  const booking = await bookingService.updateBooking(id, driver_id, {});

  return res.status(200).json({
    message: 'Booking updated successfully',
    booking
  });
});

/**
 * Hủy booking
 * 
 * Endpoint: PATCH /api/booking/:id/cancel
 * Access: Private (driver)
 * 
 * Path params:
 * - id: UUID của booking cần cancel
 * 
 * Chỉ owner của booking mới có quyền cancel.
 * Chỉ cancel được bookings có status pending.
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driver_id = req.user.account_id;

  const result = await bookingService.cancelBooking(id, driver_id);

  return res.status(200).json({
    message: result.message,
    booking_id: result.booking_id
  });
});

/**
 * Kiểm tra availability của pin tại station
 * 
 * Endpoint: GET /api/booking/check-availability
 * Access: Private (driver)
 * 
 * Query params:
 * - station_id: ID của station cần check
 * - vehicle_id: UUID của vehicle (để xác định loại pin)
 * 
 * Trả về số lượng pins available và thông tin chi tiết về station.
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { station_id, vehicle_id } = req.query;

  const result = await bookingService.checkAvailability(
    parseInt(station_id),
    vehicle_id
  );

  return res.status(200).json({
    message: result.message,
    ...result
  });
});

/**
 * Lấy danh sách bookings tại station
 * 
 * Endpoint: GET /api/booking/station/:station_id
 * Access: Private (staff/manager only)
 * 
 * Path params:
 * - station_id: ID của station
 * 
 * Query params:
 * - status: Filter theo status (pending/completed/cancelled) - optional
 * - date: Filter theo ngày (YYYY-MM-DD) - optional
 * 
 * Dùng cho staff/manager để xem bookings tại trạm họ quản lý.
 */
const getBookingsByStation = asyncHandler(async (req, res) => {
  const { station_id } = req.params;
  const { status, date } = req.query;

  const result = await bookingService.getBookingsByStation(station_id, {
    status,
    date
  });

  return res.status(200).json({
    success: true,
    message: 'Bookings retrieved successfully',
    data: result
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkAvailability,
  getBookingsByStation
};
