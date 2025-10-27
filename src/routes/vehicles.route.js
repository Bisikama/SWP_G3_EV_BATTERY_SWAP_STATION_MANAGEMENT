// ========================================
// VEHICLES ROUTES
// ========================================
// File: src/routes/vehicles.route.js
// Mục đích: Định nghĩa routes cho vehicle operations
// Base path: /api/vehicles
// ========================================

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const { verifyToken } = require('../middlewares/verifyTokens');
const vehicleValidation = require('../validations/vehicle.validation');
const { validate } = require('../middlewares/validateHandler');

/**
 * @swagger
 * tags:
 *   name: Vehicle
 *   description: Vehicle management APIs
 */

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     tags: [Vehicle]
 *     summary: Register a new vehicle
 *     description: Register a new vehicle for the authenticated driver. VIN format is validated (17 characters, alphanumeric).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *               - model_id
 *               - license_plate
 *             properties:
 *               vin:
 *                 type: string
 *                 example: 1HGBH41JXMN109186
 *                 description: Vehicle Identification Number (17 characters)
 *               model_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the vehicle model
 *               license_plate:
 *                 type: string
 *                 example: 30A-12345
 *                 description: Vehicle license plate number
 *     responses:
 *       201:
 *         description: Vehicle registered successfully
 *       400:
 *         description: Invalid VIN format or missing required fields
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Only drivers can register vehicles
 *       409:
 *         description: VIN or license plate already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  verifyToken, 
  validate(vehicleValidation.register), 
  vehicleController.registerVehicle
);

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     tags: [Vehicle]
 *     summary: Get all vehicles of authenticated driver
 *     description: Retrieve a list of all vehicles registered by the current driver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicles retrieved successfully
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/', 
  verifyToken, 
  vehicleController.getMyVehicles
);

/**
 * @swagger
 * /api/vehicles/vin/{vin}:
 *   get:
 *     tags: [Vehicle]
 *     summary: Get vehicle by VIN (public lookup)
 *     description: Retrieve vehicle information by VIN number. Returns vehicle details including model and driver information.
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 17
 *           maxLength: 17
 *         description: Vehicle Identification Number (17 characters)
 *         example: 1HGBH41JXMN109186
 *     responses:
 *       200:
 *         description: Vehicle found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle found
 *                 vehicle:
 *                   type: object
 *       400:
 *         description: Invalid VIN format
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.get('/vin/:vin', 
  validate(vehicleValidation.findByVin), 
  vehicleController.getVehicleByVin
);

/**
 * @swagger
 * /api/vehicles/without-batteries:
 *   get:
 *     tags: [Vehicle]
 *     summary: Lấy danh sách xe chưa có pin
 *     description: Lấy danh sách vehicle_id và account_id của những xe chưa có pin nào trong battery
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicles without batteries retrieved successfully
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vehicle_id:
 *                         type: string
 *                         format: uuid
 *                         example: "550e8400-e29b-41d4-a716-446655440000"
 *                       account_id:
 *                         type: string
 *                         format: uuid
 *                         example: "660e8400-e29b-41d4-a716-446655440001"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/without-batteries', 
  verifyToken, 
  vehicleController.getVehiclesWithoutBatteries
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     tags: [Vehicle]
 *     summary: Get vehicle by ID
 *     description: Retrieve vehicle information by vehicle ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID (UUID)
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Vehicle found
 *       400:
 *         description: Invalid vehicle ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', 
  verifyToken,
  validate(vehicleValidation.findById), 
  vehicleController.getVehicleById
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     tags: [Vehicle]
 *     summary: Update vehicle information
 *     description: Update vehicle information (license_plate or model_id) for the authenticated driver. VIN cannot be changed. Only the owner can update their own vehicles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the vehicle to update
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               license_plate:
 *                 type: string
 *                 description: New license plate number (optional)
 *                 example: 30B-67890
 *               model_id:
 *                 type: integer
 *                 description: New vehicle model ID (optional)
 *                 example: 2
 *           examples:
 *             updateLicensePlate:
 *               summary: Update license plate only
 *               value:
 *                 license_plate: "30B-67890"
 *             updateModelId:
 *               summary: Update model ID only
 *               value:
 *                 model_id: 2
 *             updateBoth:
 *               summary: Update both fields
 *               value:
 *                 license_plate: "30B-67890"
 *                 model_id: 2
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Bad request - no fields to update or validation error
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Vehicle belongs to another driver
 *       404:
 *         description: Vehicle or model not found
 *       409:
 *         description: License plate already exists
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
  verifyToken, 
  validate(vehicleValidation.update), 
  vehicleController.updateVehicle
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     tags: [Vehicle]
 *     summary: Delete a vehicle
 *     description: Delete a vehicle that belongs to the authenticated driver. Only the owner can delete their own vehicles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the vehicle to delete
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle deleted successfully
 *                 deleted_vehicle:
 *                   type: object
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Vehicle belongs to another driver
 *       404:
 *         description: Vehicle not found
 *       409:
 *         description: Conflict - Vehicle is being used in other records
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  verifyToken, 
  validate(vehicleValidation.findById), 
  vehicleController.deleteVehicle
);

module.exports = router;

