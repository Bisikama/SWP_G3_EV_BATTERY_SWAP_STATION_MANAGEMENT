// ========================================
// BOOKING CONTROLLER
// ========================================
// File: src/controllers/booking.controller.js
// Mục đích: HTTP request/response handler cho booking operations
// 
// Thin controller - chỉ xử lý:
// 1. Extract data từ request (body, params, query, user)
// 2. Call service methods
// 3. Format và return response
// 4. Error handling được xử lý tự động bởi asyncHandler
// 
// Business logic nằm trong booking.service.js
// ========================================

'use strict';
const bookingService = require('../services/booking.service');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * ========================================
 * CREATE BOOKING
 * ========================================
 * POST /api/booking
 * 
 * @description Tạo booking mới cho driver
 * @access Private (driver only)
 */
const createBooking = asyncHandler(async (req, res) => {
  const { vehicle_id, station_id, scheduled_start_time, battery_count } = req.body;
  const driver_id = req.user.account_id;

  const booking = await bookingService.createBooking(driver_id, {
    vehicle_id,
    station_id,
    scheduled_start_time,
    battery_count
  });

  return res.status(201).json({
    message: 'Booking created successfully',
    booking
  });
});

/**
 * ========================================
 * GET MY BOOKINGS
 * ========================================
 * GET /api/booking/my-bookings
 * 
 * @description Lấy danh sách bookings của driver đang đăng nhập với filter status
 * @access Private (driver)
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const driver_id = req.user.account_id;
  const { page = 1, limit = 10, status } = req.query;

  const result = await bookingService.getBookingsByDriver(driver_id, {
    page: parseInt(page),
    limit: parseInt(limit),
    status
  });

  return res.status(200).json({
    message: 'Bookings retrieved successfully',
    bookings: result.bookings,
    pagination: result.pagination
  });
});

/**
 * ========================================
 * GET BOOKING BY ID
 * ========================================
 * GET /api/booking/:id
 * 
 * @description Lấy chi tiết booking theo ID
 * @access Private (driver/admin)
 */
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const driver_id = req.user.account_id;
  const permission = req.user.permission;

  // Admin có thể xem tất cả bookings, driver chỉ xem của mình
  const checkOwnership = permission !== 'admin' ? driver_id : null;

  const booking = await bookingService.getBookingById(id, checkOwnership);

  return res.status(200).json({
    message: 'Booking retrieved successfully',
    booking
  });
});

/**
 * ========================================
 * UPDATE BOOKING
 * ========================================
 * PATCH /api/booking/:id
 * 
 * @description Cập nhật thời gian booking
 * @access Private (driver only - owner)
 */
const updateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduled_start_time } = req.body;
  const driver_id = req.user.account_id;

  const booking = await bookingService.updateBooking(id, driver_id, {
    scheduled_start_time
  });

  return res.status(200).json({
    message: 'Booking updated successfully',
    booking
  });
});

/**
 * ========================================
 * CANCEL BOOKING (SOFT DELETE)
 * ========================================
 * DELETE /api/booking/:id
 * 
 * @description Hủy booking bằng cách update status = 'cancelled'
 * @access Private (driver)
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
 * ========================================
 * CHECK AVAILABILITY
 * ========================================
 * GET /api/booking/check-availability
 * 
 * @description Kiểm tra station có sẵn battery tại thời điểm cụ thể
 * @access Private (driver)
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const { station_id, datetime, vehicle_id } = req.query;

  const result = await bookingService.checkAvailability(
    parseInt(station_id),
    vehicle_id,
    datetime
  );

  return res.status(200).json({
    message: result.message,
    ...result
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkAvailability
};
