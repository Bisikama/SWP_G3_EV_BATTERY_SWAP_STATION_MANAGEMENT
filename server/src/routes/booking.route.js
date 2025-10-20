// ========================================
// BOOKING ROUTES
// ========================================
// File: src/routes/booking.route.js
// Mục đích: Định nghĩa routes cho booking operations
// Base path: /api/booking
// ========================================

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const bookingValidation = require('../validations/booking.validation');
const { validate } = require('../middlewares/validateHandler');

/**
 * @swagger
 * tags:
 *   name: Booking
 *   description: Booking management APIs for battery swap reservations
 */

/**
 * @swagger
 * /api/booking:
 *   post:
 *     tags: [Booking]
 *     summary: Create a new booking
 *     description: Create a battery swap booking at a station for a specific vehicle. The system will automatically find and reserve suitable batteries based on battery_count.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *               - station_id
 *               - scheduled_start_time
 *             properties:
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: UUID of the vehicle for battery swap
 *               station_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the station
 *               scheduled_start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-10-20T14:00:00Z
 *                 description: Scheduled start time (must be in the future, within today)
 *               battery_count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 1
 *                 example: 2
 *                 description: Number of batteries to swap (must not exceed subscription plan's battery_cap)
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Booking created successfully
 *                 booking:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *       403:
 *         description: Forbidden - not the vehicle owner
 *       404:
 *         description: Vehicle or station not found
 *       409:
 *         description: Duplicate booking in time slot
 *       422:
 *         description: No available batteries, battery_count exceeds battery_cap, or station not operational
 */
router.post(
  '/',
  verifyToken,
  authorizeRole('driver'),
  validate(bookingValidation.createBooking),
  bookingController.createBooking
);

/**
 * @swagger
 * /api/booking/my-bookings:
 *   get:
 *     tags: [Booking]
 *     summary: Get my bookings
 *     description: Retrieve all bookings of the authenticated driver with pagination and optional status filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter bookings by status
 *         example: pending
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bookings retrieved successfully
 *                 bookings:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - no token provided
 */
router.get(
  '/my-bookings',
  verifyToken,
  authorizeRole('driver'),
  validate(bookingValidation.getMyBookings),
  bookingController.getMyBookings
);

/**
 * @swagger
 * /api/booking/check-availability:
 *   get:
 *     tags: [Booking]
 *     summary: Check current station availability
 *     description: Check if a station currently has available batteries for a specific vehicle type. This checks real-time availability at the moment of request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the station to check
 *         example: 1
 *       - in: query
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the vehicle (to determine battery type compatibility)
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Availability check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Station has available batteries for VF-STD
 *                 available:
 *                   type: boolean
 *                   example: true
 *                 station:
 *                   type: object
 *                   properties:
 *                     station_id:
 *                       type: integer
 *                     station_name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     status:
 *                       type: string
 *                 battery_type:
 *                   type: object
 *                   properties:
 *                     battery_type_id:
 *                       type: integer
 *                     battery_type_code:
 *                       type: string
 *                 availability_details:
 *                   type: object
 *                   properties:
 *                     available_batteries_count:
 *                       type: integer
 *                       description: Total count of charged batteries available
 *                     total_slots:
 *                       type: integer
 *                       description: Total cabinet slots at station
 *                     current_pending_bookings:
 *                       type: integer
 *                       description: Number of pending bookings in next 30 minutes
 *                     effective_available:
 *                       type: integer
 *                       description: Actual available batteries after pending bookings
 *                     station_status:
 *                       type: string
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Station or vehicle not found
 */
router.get(
  '/check-availability',
  verifyToken,
  authorizeRole('driver'),
  validate(bookingValidation.checkAvailability),
  bookingController.checkAvailability
);

/**
 * @swagger
 * /api/booking/{id}:
 *   get:
 *     tags: [Booking]
 *     summary: Get booking by ID
 *     description: Retrieve detailed information about a specific booking. Drivers can only view their own bookings, admins can view all.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Booking retrieved successfully
 *                 booking:
 *                   type: object
 *       400:
 *         description: Bad request - invalid booking ID
 *       403:
 *         description: Forbidden - not authorized to view this booking
 *       404:
 *         description: Booking not found
 */
router.get(
  '/:id',
  verifyToken,
  authorizeRole('driver', 'admin'),
  validate(bookingValidation.getBookingById),
  bookingController.getBookingById
);

/**
 * @swagger
 * /api/booking/{id}:
 *   patch:
 *     tags: [Booking]
 *     summary: Update booking time
 *     description: Update the scheduled start time of a pending booking. Can only update bookings with status 'pending' that haven't started yet.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduled_start_time
 *             properties:
 *               scheduled_start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-10-20T15:00:00Z
 *                 description: New scheduled start time
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Booking updated successfully
 *                 booking:
 *                   type: object
 *       400:
 *         description: Bad request - validation error
 *       403:
 *         description: Forbidden - not the booking owner
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Duplicate booking in new time slot
 *       422:
 *         description: |
 *           Unprocessable Entity - Cannot update:
 *           - Booking status is not 'pending' (already completed or cancelled)
 *           - Booking has already started or passed
 */
router.patch(
  '/:id',
  verifyToken,
  authorizeRole('driver'),
  validate(bookingValidation.updateBooking),
  bookingController.updateBooking
);

/**
 * @swagger
 * /api/booking/{id}:
 *   delete:
 *     tags: [Booking]
 *     summary: Cancel booking (soft delete)
 *     description: Cancel a pending booking by updating its status to 'cancelled'. Cannot cancel within 5 minutes of scheduled start time. This is a soft delete - the booking record is preserved for history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID to cancel
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Booking cancelled successfully
 *                 booking_id:
 *                   type: string
 *                   format: uuid
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *       400:
 *         description: Bad request - invalid booking ID
 *       403:
 *         description: Forbidden - not the booking owner
 *       404:
 *         description: Booking not found
 *       422:
 *         description: |
 *           Unprocessable Entity - Cannot cancel:
 *           - Booking status is not 'pending' (already completed or cancelled)
 *           - Trying to cancel within 5 minutes of scheduled start time
 */
router.delete(
  '/:id',
  verifyToken,
  authorizeRole('driver'),
  validate(bookingValidation.cancelBooking),
  bookingController.cancelBooking
);

module.exports = router;
