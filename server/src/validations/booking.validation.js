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
 */
const createBooking = [
  body('vehicle_id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isUUID().withMessage('Vehicle ID must be a valid UUID'),

  body('station_id')
    .notEmpty().withMessage('Station ID is required')
    .isInt({ gt: 0 }).withMessage('Station ID must be a positive integer'),

  body('scheduled_start_time')
    .notEmpty().withMessage('Scheduled start time is required')
    .isISO8601().withMessage('Scheduled start time must be a valid ISO 8601 date')
    .custom((value) => {
      const inputDate = new Date(value);
      const now = new Date();

      // Kiểm tra không được là thời gian quá khứ
      if (inputDate <= now) {
        throw new Error('Scheduled start time must be in the future');
      }

      // Chỉ cho đặt trong ngày hôm nay (so sánh ngày/tháng/năm theo local time)
      const inputDay = inputDate.getDate();
      const inputMonth = inputDate.getMonth();
      const inputYear = inputDate.getFullYear();
      
      const todayDay = now.getDate();
      const todayMonth = now.getMonth();
      const todayYear = now.getFullYear();

      // Debug log
      console.log('\n=== 🔍 BOOKING TIME VALIDATION ===');
      console.log('Input ISO:', value);
      console.log('Input Local:', inputDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
      console.log('Now Local:', now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
      console.log('Input Date:', `${inputDay}/${inputMonth + 1}/${inputYear}`);
      console.log('Today Date:', `${todayDay}/${todayMonth + 1}/${todayYear}`);
      console.log('Is Same Day?:', inputDay === todayDay && inputMonth === todayMonth && inputYear === todayYear);
      console.log('=== END DEBUG ===\n');

      if (inputDay !== todayDay || inputMonth !== todayMonth || inputYear !== todayYear) {
        throw new Error(`Scheduled start time must be within today (${todayDay}/${todayMonth + 1}/${todayYear})`);
      }

      return true;
    }),

  body('battery_count')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Battery count must be an integer between 1 and 20')
    .toInt()
];

/**
 * Validation cho việc cập nhật booking
 * PATCH /api/booking/:id
 */
const updateBooking = [
  param('id')
    .notEmpty().withMessage('Booking ID is required')
    .isUUID().withMessage('Booking ID must be a valid UUID'),

  body('scheduled_start_time')
    .notEmpty().withMessage('Scheduled start time is required')
    .isISO8601().withMessage('Scheduled start time must be a valid ISO 8601 date')
    .custom((value) => {
      const inputDate = new Date(value);
      const now = new Date();

      // Kiểm tra không được là thời gian quá khứ
      if (inputDate <= now) {
        throw new Error('Scheduled start time must be in the future');
      }

      // Chỉ cho đặt trong ngày hôm nay (so sánh ngày/tháng/năm theo local time)
      const inputDay = inputDate.getDate();
      const inputMonth = inputDate.getMonth();
      const inputYear = inputDate.getFullYear();
      
      const todayDay = now.getDate();
      const todayMonth = now.getMonth();
      const todayYear = now.getFullYear();

      if (inputDay !== todayDay || inputMonth !== todayMonth || inputYear !== todayYear) {
        throw new Error(`Scheduled start time must be within today (${todayDay}/${todayMonth + 1}/${todayYear})`);
      }

      return true;
    })
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
  query('page')
    .optional()
    .isInt({ gt: 0 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ gt: 0, lt: 101 }).withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Status must be pending, completed, or cancelled')
];

/**
 * Validation cho việc hủy booking
 * DELETE /api/booking/:id
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
