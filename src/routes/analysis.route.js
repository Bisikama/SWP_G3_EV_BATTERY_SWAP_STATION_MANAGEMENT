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
 *           format: date
 *         description: Filter results from this date (YYYY-MM-DD)
 *         example: 2025-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter results up to this date (YYYY-MM-DD)
 *         example: 2025-01-31
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
 *           format: date
 *         description: Filter results from this date (YYYY-MM-DD)
 *         example: 2025-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter results up to this date (YYYY-MM-DD)
 *         example: 2025-01-31
 *       - in: query
 *         name: groupDate
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Group results by time period
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
 *           format: date
 *         description: Filter results from this date (YYYY-MM-DD)
 *         example: 2025-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter results up to this date (YYYY-MM-DD)
 *         example: 2025-01-31
 *       - in: query
 *         name: groupDate
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Group results by time period
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
 *           format: date
 *         description: Filter results from this date (YYYY-MM-DD)
 *         example: 2025-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter results up to this date (YYYY-MM-DD)
 *         example: 2025-01-31
 *       - in: query
 *         name: groupDate
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Group results by time period
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

/**
 * @swagger
 * /api/analysis/export:
 *   get:
 *     summary: Export analysis report to Excel
 *     description: Generates an Excel file containing all analysis data (bookings, revenue, swaps, subscriptions) for the specified date range. Returns a downloadable .xlsx file.
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis period (YYYY-MM-DD format, local timezone)
 *         example: 2025-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis period (YYYY-MM-DD format, local timezone)
 *         example: 2025-01-31
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized - Missing or invalid Bearer token
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Internal server error
 */
router.get('/export',
  verifyToken,
  authorizeRole('admin'),
  analysisController.exportAnalysis
);

module.exports = router;
