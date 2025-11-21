// ========================================
// CONFIG ROUTES
// ========================================
// File: src/routes/config.route.js
// Purpose: Define API endpoints for system configuration management
// ========================================

const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

/**
 * @swagger
 * tags:
 *   name: Config
 *   description: System configuration management
 */

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Get current system configuration
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     config_id:
 *                       type: integer
 *                     booking_expired_interval:
 *                       type: integer
 *                       description: Booking expiration interval in minutes
 *                     soh_available_threshole:
 *                       type: number
 *                       description: SOH threshold for battery availability (0-100)
 *                     soh_maintenance_threshole:
 *                       type: number
 *                       description: SOH threshold for battery maintenance (0-100)
 *                     allowed_empty_slot:
 *                       type: integer
 *                       description: Number of allowed empty slots
 *                     soc_available_threshole:
 *                       type: number
 *                       description: SOC threshold for battery availability (0-100)
 */
router.get('/', verifyToken, authorizeRole('admin'), configController.getConfig);

/**
 * @swagger
 * /api/config/booking-interval:
 *   get:
 *     summary: Get booking expired interval configuration
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking expired interval retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: integer
 *                   description: Booking expiration interval in minutes
 *                   example: 30
 *                 message:
 *                   type: string
 *                   example: Configuration booking expired interval retrieved successfully
 *       500:
 *         description: Configuration not loaded
 */
router.get('/booking-interval', verifyToken, configController.getConfigBookingInterval);

/**
 * @swagger
 * /api/config/{key}:
 *   get:
 *     summary: Get specific configuration value by key
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration key (e.g., booking_expired_interval)
 *     responses:
 *       200:
 *         description: Configuration value retrieved successfully
 *       404:
 *         description: Configuration key not found
 */
router.get('/:key', verifyToken, authorizeRole('admin'), configController.getConfigValue);

/**
 * @swagger
 * /api/config:
 *   put:
 *     summary: Update system configuration (Admin only)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               booking_expired_interval:
 *                 type: integer
 *                 description: Booking expiration interval in minutes
 *                 minimum: 1
 *                 example: 45
 *               soh_available_threshole:
 *                 type: number
 *                 description: SOH threshold for battery availability (0-100)
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 80
 *               soh_maintenance_threshole:
 *                 type: number
 *                 description: SOH threshold for battery maintenance (0-100)
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 60
 *               allowed_empty_slot:
 *                 type: integer
 *                 description: Number of allowed empty slots
 *                 minimum: 0
 *                 example: 5
 *               soc_available_threshole:
 *                 type: number
 *                 description: SOC threshold for battery availability (0-100)
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 70
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/', verifyToken, authorizeRole('admin'), configController.updateConfig);

/**
 * @swagger
 * /api/config/reset:
 *   post:
 *     summary: Reset configuration to default values (Admin only)
 *     tags: [Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration reset successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Configuration not found
 */
router.post('/reset', verifyToken, authorizeRole('admin'), configController.resetConfig);

module.exports = router;
