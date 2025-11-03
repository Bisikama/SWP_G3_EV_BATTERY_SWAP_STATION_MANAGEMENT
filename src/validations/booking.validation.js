// ========================================
// BOOKING VALIDATION
// ========================================
// File: src/validations/booking.validation.js
// Mục đích: Validation schemas cho booking operations
// Sử dụng express-validator để validate input
// ========================================

const { body, param, query } = require('express-validator');

/**
 * Validation cho việc tạo booking mới
 * POST /api/booking
 * 
 * NOTE: scheduled_time removed - booking expiration is now auto-calculated
 * based on booking_expired_interval from config table
 */
const createBooking = [
  body('battery_quantity')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Battery quantity must be an integer between 1 and 10')
    .toInt()
  // Note: Max validation (battery_quantity <= battery_slot) sẽ được check trong service layer
  // vì cần query vehicle model từ database
];

/**
 * Validation cho việc cập nhật booking
 * PATCH /api/booking/:id
 * 
 * NOTE: Update booking is deprecated as booking times are auto-managed.
 * This validation is kept for backward compatibility but will reject all requests.
 */
const updateBooking = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isUUID().withMessage('Booking ID must be a valid UUID')
];

/**
 * Validation cho việc lấy chi tiết booking
 * GET /api/booking/:id
 */
const getBookingById = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isUUID().withMessage('Booking ID must be a valid UUID')
];

/**
 * Validation cho việc lấy danh sách bookings
 * GET /api/booking/my-bookings
 */
const getMyBookings = [
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Status must be pending, completed, or cancelled')
];

/**
 * Validation cho việc hủy booking
 * PATCH /api/booking/:id/cancel
 */
const cancelBooking = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isUUID().withMessage('Booking ID must be a valid UUID')
];

/**
 * Validation cho việc kiểm tra availability
 * GET /api/booking/check-availability
 * Check availability hiện tại cho loại pin của xe
 */
const checkAvailability = [
  query('station_id')
    .notEmpty().withMessage('Station ID is required')
    .isInt({ gt: 0 }).withMessage('Station ID must be a positive integer'),

  query('vehicle_id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isUUID().withMessage('Vehicle ID must be a valid UUID')
];

module.exports = {
  createBooking,
  updateBooking,
  cancelBooking,
  getBookingById,
  getMyBookings,
  checkAvailability
};
