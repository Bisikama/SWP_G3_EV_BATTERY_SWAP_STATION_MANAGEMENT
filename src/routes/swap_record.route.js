const express = require('express');
const router = express.Router();
const swapRecordController = require('../controllers/swap_record.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

/**
 * @swagger
 * tags:
 *   name: Swap Records
 *   description: API for managing battery swap records
 */

/**
 * @swagger
 * /api/swap-records:
 *   get:
 *     tags: [Swap Records]
 *     summary: Get all swap records with optional filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: vehicle_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: integer
 *         description: Filter by station ID
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-01"
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-31"
 *         description: End date for filtering (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of swap records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', verifyToken, swapRecordController.getAllSwapRecords);

/**
 * @swagger
 * /api/swap-records/driver/{driver_id}:
 *   get:
 *     tags: [Swap Records]
 *     summary: Get swap records by driver ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver account ID
 *     responses:
 *       200:
 *         description: Swap records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *       400:
 *         description: Missing driver_id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/driver/:driver_id', verifyToken, swapRecordController.getSwapRecordsByDriver);

/**
 * @swagger
 * /api/swap-records/vehicle/{vehicle_id}:
 *   get:
 *     tags: [Swap Records]
 *     summary: Get swap records by vehicle ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Swap records retrieved successfully
 *       400:
 *         description: Missing vehicle_id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/vehicle/:vehicle_id', verifyToken, swapRecordController.getSwapRecordsByVehicle);

/**
 * @swagger
 * /api/swap-records/station/{station_id}:
 *   get:
 *     tags: [Swap Records]
 *     summary: Get swap records by station ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Station ID
 *     responses:
 *       200:
 *         description: Swap records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *       400:
 *         description: Missing station_id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/station/:station_id', verifyToken, swapRecordController.getSwapRecordsByStation);

/**
 * @swagger
 * /api/swap-records/driver/{driver_id}/station/{station_id}:
 *   get:
 *     tags: [Swap Records]
 *     summary: Get swap records by driver at a specific station
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver account ID
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Station ID
 *     responses:
 *       200:
 *         description: Swap records retrieved successfully
 *       400:
 *         description: Missing driver_id or station_id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/driver/:driver_id/station/:station_id', verifyToken, swapRecordController.getSwapRecordsByDriverAndStation);

/**
 * @swagger
 * /api/swap-records/vehicle/{vehicle_id}/station/{station_id}:
 *   get:
 *     tags: [Swap Records]
 *     summary: Get swap records by vehicle at a specific station
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Station ID
 *     responses:
 *       200:
 *         description: Swap records retrieved successfully
 *       400:
 *         description: Missing vehicle_id or station_id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/vehicle/:vehicle_id/station/:station_id', verifyToken, swapRecordController.getSwapRecordsByVehicleAndStation);

/**
 * @swagger
 * /api/swap-records/statistics:
 *   get:
 *     tags: [Swap Records]
 *     summary: Get swap statistics
 *     security:
 *       - bearerAuth: []
 *     description: Get aggregated statistics including total swaps, average SOH in/out
 *     parameters:
 *       - in: query
 *         name: driver_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver ID
 *       - in: query
 *         name: vehicle_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: integer
 *         description: Filter by station ID
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSwaps:
 *                       type: integer
 *                       example: 150
 *                     avgSohIn:
 *                       type: number
 *                       example: 75.5
 *                     avgSohOut:
 *                       type: number
 *                       example: 95.2
 *                     period:
 *                       type: object
 *                       properties:
 *                         from:
 *                           type: string
 *                           nullable: true
 *                         to:
 *                           type: string
 *                           nullable: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', verifyToken, swapRecordController.getSwapStatistics);

/**
 * @swagger
 * /api/swap-records/{swap_id}:
 *   get:
 *     tags: [Swap Records]
 *     summary: Get a swap record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: swap_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Swap record ID
 *     responses:
 *       200:
 *         description: Swap record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing swap_id
 *       404:
 *         description: Swap record not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:swap_id', verifyToken, swapRecordController.getSwapRecordById);

module.exports = router;
