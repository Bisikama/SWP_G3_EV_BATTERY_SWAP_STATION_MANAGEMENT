const express = require('express');
const router = express.Router();
const batteryController = require('../controllers/battery.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

/**
 * @swagger
 * tags:
 *   name: Batteries
 *   description: Battery management APIs
 */

/**
 * @swagger
 * /api/battery/filterCount:
 *   get:
 *     tags: [Batteries]
 *     summary: Count batteries by station and battery type
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
 * /api/battery/all:
 *   get:
 *     tags: [Batteries]
 *     summary: Get all batteries
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

module.exports = router;