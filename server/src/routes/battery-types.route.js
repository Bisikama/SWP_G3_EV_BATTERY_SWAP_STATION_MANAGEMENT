const express = require('express');
const router = express.Router();
const batteryTypeController = require('../controllers/batteryType.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const { handleValidation } = require('../middlewares/validateHandler');
const { batteryTypeRules } = require('../middlewares/validateBatteryType');

/**
 * @swagger
 * /api/battery-type:
 *   get:
 *     tags: [Battery Type]
 *     summary: Get all battery types
 *     responses:
 *       200:
 *         description: Successfully retrieved list of battery types
 *       500:
 *         description: Internal server error
 */
router.get('/', 
	batteryTypeController.findAll
);


/**
 * @swagger
 * /api/battery-type/{id}:
 *   get:
 *     tags: [Battery Type]
 *     summary: Get a battery type by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Battery type ID
 *     responses:
 *       200:
 *         description: Battery type found successfully
 *       404:
 *         description: Battery type not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id',
	batteryTypeController.findById
);

/**
 * @swagger
 * /api/battery-type:
 *   post:
 *     tags: [Battery Type]
 *     summary: Create a new battery type
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - battery_type_code
 *               - nominal_capacity
 *               - nominal_voltage
 *               - min_voltage
 *               - max_voltage
 *               - rated_charge_current
 *               - max_charge_current
 *               - cell_chemistry
 *             properties:
 *               battery_type_code:
 *                 type: string
 *                 example: "LFP-48V100Ah"
 *               nominal_capacity:
 *                 type: number
 *                 format: float
 *                 example: 4800.00
 *               nominal_voltage:
 *                 type: number
 *                 format: float
 *                 example: 48.00
 *               min_voltage:
 *                 type: number
 *                 format: float
 *                 example: 42.00
 *               max_voltage:
 *                 type: number
 *                 format: float
 *                 example: 54.60
 *               rated_charge_current:
 *                 type: number
 *                 format: float
 *                 example: 50.00
 *               max_charge_current:
 *                 type: number
 *                 format: float
 *                 example: 100.00
 *               cell_chemistry:
 *                 type: string
 *                 enum: [Li-ion, LFP]
 *                 example: "LFP"
 *     responses:
 *       201:
 *         description: Battery type created successfully
 *       400:
 *         description: Missing or invalid input data
 *       401:
 *         description: Unauthorized access
 *       409:
 *         description: Battery type code already exists
 *       500:
 *         description: Internal server error
 */
router.post('/',
	[
		batteryTypeRules.battery_type_code,
		batteryTypeRules.nominal_capacity,
		batteryTypeRules.nominal_voltage,
		batteryTypeRules.min_voltage,
		batteryTypeRules.max_voltage,
		batteryTypeRules.rated_charge_current,
		batteryTypeRules.max_charge_current,
		batteryTypeRules.cell_chemistry,
		handleValidation
	],
	verifyToken,
	authorizeRole('admin'),
	batteryTypeController.create
);

/**
 * @swagger
 * /api/battery-type/{id}:
 *   put:
 *     tags: [Battery Type]
 *     summary: Update a battery type by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Battery type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               battery_type_code:
 *                 type: string
 *               nominal_capacity:
 *                 type: number
 *               nominal_voltage:
 *                 type: number
 *               min_voltage:
 *                 type: number
 *               max_voltage:
 *                 type: number
 *               rated_charge_current:
 *                 type: number
 *               max_charge_current:
 *                 type: number
 *               cell_chemistry:
 *                 type: string
 *                 enum: [Li-ion, LFP]
 *     responses:
 *       200:
 *         description: Battery type updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Battery type not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
	[
		batteryTypeRules.battery_type_code.optional(),
		batteryTypeRules.nominal_capacity.optional(),
		batteryTypeRules.nominal_voltage.optional(),
		batteryTypeRules.min_voltage.optional(),
		batteryTypeRules.max_voltage.optional(),
		batteryTypeRules.rated_charge_current.optional(),
		batteryTypeRules.max_charge_current.optional(),
		batteryTypeRules.cell_chemistry.optional(),
		handleValidation
	],
	verifyToken,
	authorizeRole('admin'),
	batteryTypeController.update
);

/**
 * @swagger
 * /api/battery-type/{id}:
 *   delete:
 *     tags: [Battery Type]
 *     summary: Delete a battery type by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Battery type ID
 *     responses:
 *       200:
 *         description: Battery type deleted successfully
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Battery type not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
	verifyToken, 
	authorizeRole('admin'), 
	batteryTypeController.remove
);

module.exports = router;
