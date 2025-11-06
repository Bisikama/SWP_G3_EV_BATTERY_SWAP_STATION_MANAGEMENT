const express = require('express');
const router = express.Router();
const batteryController = require('../controllers/battery.controller');
const { verifyToken } = require('../middlewares/verifyTokens');

/**
 * @swagger
 * tags:
 *   name: Batteries
 *   description: Battery management APIs
 */

/**
 * @swagger
 * /api/batteries/filterCount:
 *   get:
 *     tags: [Batteries]
 *     summary: Count batteries by station and battery type
 *     security:
 *       - bearerAuth: []
 *     description: Get the total count of batteries filtered by station name and battery type code. This endpoint performs a complex query joining Battery, BatteryType, CabinetSlot, Cabinet, and Station tables.
 *     parameters:
 *       - in: query
 *         name: stationName
 *         required: true
 *         schema:
 *           type: string
 *           example: District 1 Central Station
 *         description: The name of the station to filter batteries
 *       - in: query
 *         name: batteryTypeCode
 *         required: true
 *         schema:
 *           type: string
 *           example: NMC-75
 *         description: The battery type code (e.g., NMC-75, LFP-02)
 *     responses:
 *       200:
 *         description: Count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 25
 *                   description: Total number of batteries matching the criteria
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: stationName and batteryTypeCode are required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/filterCount', verifyToken, batteryController.countByStationAndType);

/**
 * @swagger
 * /api/batteries/all:
 *   get:
 *     tags: [Batteries]
 *     summary: Get all batteries
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve a list of all batteries in the system without any filters
 *     responses:
 *       200:
 *         description: List of all batteries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   battery_id:
 *                     type: string
 *                     format: uuid
 *                     example: 550e8400-e29b-41d4-a716-446655440000
 *                     description: Unique battery identifier
 *                   battery_type_id:
 *                     type: string
 *                     format: uuid
 *                     example: 660e8400-e29b-41d4-a716-446655440001
 *                     description: Battery type foreign key
 *                   slot_id:
 *                     type: string
 *                     format: uuid
 *                     example: 770e8400-e29b-41d4-a716-446655440002
 *                     description: Cabinet slot foreign key
 *                   battery_status:
 *                     type: string
 *                     enum: [available, in_use, charging, maintenance, broken]
 *                     example: available
 *                     description: Current status of the battery
 *                   charge_level:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                     example: 85
 *                     description: Battery charge level in percentage
 *                   health_status:
 *                     type: string
 *                     enum: [good, fair, poor]
 *                     example: good
 *                     description: Battery health condition
 *                   manufacture_date:
 *                     type: string
 *                     format: date
 *                     example: 2024-01-15
 *                     description: Date when battery was manufactured
 *                   last_maintenance_date:
 *                     type: string
 *                     format: date
 *                     example: 2024-10-01
 *                     description: Date of last maintenance check
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/all', verifyToken, batteryController.getAll);

/**
 * @swagger
 * /api/batteries/vehicle/{vehicle_id}:
 *   get:
 *     summary: Get all batteries of a specific vehicle
 *     tags: [Batteries]
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the vehicle
 *     responses:
 *       200:
 *         description: List of batteries belonging to the vehicle
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Missing vehicle_id
 *       500:
 *         description: Internal server error
 */
router.get('/vehicle/:vehicle_id', batteryController.getByVehicle);

/**
 * @swagger
 * /api/batteries/vehicle/{vehicle_id}:
 *   post:
 *     summary: Create batteries for a specific vehicle
 *     tags: [Batteries]
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the vehicle
 *     responses:
 *       200:
 *         description: Batteries created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Missing or invalid vehicle_id
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.post('/vehicle/:vehicle_id', batteryController.createByVehicle);

/**
 * @swagger
 * /api/batteries/station/{station_id}:
 *   get:
 *     tags: [Batteries]
 *     summary: Get battery statistics at a specific station
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retrieve comprehensive battery statistics for a specific station including:
 *       - Total number of batteries at the station
 *       - Number of batteries available for swap (charged and ready)
 *       
 *       This endpoint performs complex queries to gather all batteries located in cabinets at the specified station,
 *       then filters for batteries that are available for swap operations.
 *     parameters:
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: string
 *           format: integer
 *           example: 1
 *         description: The unique identifier of the station
 *     responses:
 *       200:
 *         description: Battery statistics retrieved successfully
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
 *                     TotalBatteries:
 *                       type: integer
 *                       example: 50
 *                       description: Total number of batteries at the station (in all cabinets)
 *                     AvailableForSwap:
 *                       type: integer
 *                       example: 32
 *                       description: Number of batteries available for swap (charged, good health, in charging/charged slots)
 *                     message:
 *                       type: string
 *                       example: "Total batteries at station 550e8400-e29b-41d4-a716-446655440000: 50, Available for swap: 32"
 *                       description: Human-readable summary message
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     TotalBatteries: 50
 *                     AvailableForSwap: 32
 *                     message: "Total batteries at station 550e8400-e29b-41d4-a716-446655440000: 50, Available for swap: 32"
 *       400:
 *         description: Missing or invalid station_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: station_id is required
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
                 error:
                   type: string
                   example: Database connection failed
 */
router.get('/station/:station_id', verifyToken, batteryController.getBatteryAtStation);

module.exports = router;