const express = require('express');
const router = express.Router();
const batteryController = require('../controllers/battery.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const batteryValidator = require('../validations/battery.validation');
const { validate } = require('../middlewares/validateHandler');

router.get('/filterCount', 
  verifyToken, 
  batteryController.countByStationAndType
);

router.get('/all', 
  verifyToken, 
  authorizeRole('admin'),
  validate(batteryValidator.findAll),
  batteryController.findAll
);

router.get('/vehicle/:vehicle_id',
  validate(batteryValidator.findByVehicle), 
  batteryController.findByVehicle
);

router.post('/vehicle/:vehicle_id', 
  validate(batteryValidator.createByVehicle),
  batteryController.createByVehicle
);

router.get('/station/:station_id', 
  verifyToken, 
  authorizeRole('admin', 'staff'),
  validate(batteryValidator.getBatteryAtStation),
  batteryController.getBatteryAtStation
);

router.put(
  '/:battery_id/',
  verifyToken,
  authorizeRole('driver'),
  validate(batteryValidator.update),
  batteryController.update
);

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
 *     description: |
 *       Requires authentication.
 *       Accessible by **admin** and **staff** roles.  
 *       Get the total count of batteries filtered by station name and battery type code.  
 *       This endpoint performs a complex query joining `Battery`, `BatteryType`, `CabinetSlot`, `Cabinet`, and `Station` tables.
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
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized or invalid token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/batteries/all:
 *   get:
 *     tags: [Batteries]
 *     summary: Get all batteries
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Requires authentication.  
 *       Accessible by **admin** only.  
 *       Retrieve a paginated list of batteries with optional filter by station.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: integer
 *         description: Optional filter to return batteries for a specific station
 *     responses:
 *       200:
 *         description: List of batteries retrieved successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - only admin role allowed
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/batteries/vehicle/{vehicle_id}:
 *   get:
 *     tags: [Batteries]
 *     summary: Get all batteries of a specific vehicle
 *     description: Retrieve batteries assigned to a particular vehicle.
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
 *       400:
 *         description: Invalid vehicle ID
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/batteries/vehicle/{vehicle_id}:
 *   post:
 *     tags: [Batteries]
 *     summary: Create batteries for a specific vehicle
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Requires authentication.  
 *       Accessible by **admin** or **staff** roles.
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Batteries created successfully
 *       400:
 *         description: Missing or invalid vehicle_id
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - only admin/staff allowed
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/batteries/station/{station_id}:
 *   get:
 *     tags: [Batteries]
 *     summary: Get battery statistics at a specific station
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Requires authentication.  
 *       Accessible by **admin** and **staff** roles.  
 *       Retrieve comprehensive statistics for a specific station, including:
 *       - Total number of batteries at the station  
 *       - Number of batteries available for swap
 *     parameters:
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Battery statistics retrieved successfully
 *       400:
 *         description: Missing or invalid station_id parameter
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - only admin/staff allowed
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/batteries/{battery_id}:
 *   put:
 *     tags: [Batteries]
 *     summary: Update the SOC (State of Charge) and SOH (State of Health) of a battery
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Requires authentication.  
 *       Accessible by **driver** role only.  
 *       Updates the battery's `current_soc` and `current_soh` values.
 *     parameters:
 *       - in: path
 *         name: battery_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the battery to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               current_soc:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 80.5
 *               current_soh:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 95.0
 *     responses:
 *       200:
 *         description: Battery SOC and SOH updated successfully
 *       400:
 *         description: Invalid input or missing parameters
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - only driver role allowed
 *       404:
 *         description: Battery not found
 */

module.exports = router;