const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

/**
 * @swagger
 * tags:
 *   name: Analysis
 *   description: Analytics endpoints for bookings, revenue, swaps, and subscriptions
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/analysis/bookings:
 *   get:
 *     summary: Analyze bookings
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter results from this date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter results up to this date (ISO 8601)
 *       - in: query
 *         name: groupDate
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Group results by time period
 *     responses:
 *       200:
 *         description: Booking analysis results
 *       401:
 *         description: Unauthorized - Missing or invalid Bearer token
 */
router.get('/bookings',
  verifyToken,
  authorizeRole('admin'),
  analysisController.analyzeBooking
);

/**
 * @swagger
 * /api/analysis/revenue:
 *   get:
 *     summary: Analyze total revenue
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: groupDate
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *     responses:
 *       200:
 *         description: Revenue analysis results
 *       401:
 *         description: Unauthorized - Missing or invalid Bearer token
 */
router.get('/revenue',
  verifyToken,
  authorizeRole('admin'),
  analysisController.analyzeRevenue
);

/**
 * @swagger
 * /api/analysis/swaps:
 *   get:
 *     summary: Analyze swap activity by station
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: groupDate
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *     responses:
 *       200:
 *         description: Swap activity results grouped by station
 *       401:
 *         description: Unauthorized - Missing or invalid Bearer token
 */
router.get('/swaps',
  verifyToken,
  authorizeRole('admin'),
  analysisController.analyzeSwap
);

/**
 * @swagger
 * /api/analysis/subscriptions:
 *   get:
 *     summary: Analyze subscriptions by plan
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: groupDate
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *     responses:
 *       200:
 *         description: Subscription analysis results grouped by plan
 *       401:
 *         description: Unauthorized - Missing or invalid Bearer token
 */
router.get('/subscriptions',
  verifyToken,
  authorizeRole('admin'),
  analysisController.analyzeSubscription
);

module.exports = router;
