const express = require('express');
const router = express.Router();
const vehicleModelController = require('../controllers/vehicleModel.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const vehicleModelValidator = require('../validations/vehicleModel.validation');
const { validate } = require('../middlewares/validateHandler');

/**
 * @swagger
 * /api/vehicle-model:
 *   get:
 *     tags: [Vehicle Model]
 *     summary: Get all vehicle models
 *     responses:
 *       200:
 *         description: List of vehicle models
 *       500:
 *         description: Internal server error
 */
router.get('/', 
    vehicleModelController.findAll
);

/**
 * @swagger
 * /api/vehicle-model/{id}:
 *   get:
 *     tags: [Vehicle Model]
 *     summary: Get a vehicle model by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vehicle model ID
 *     responses:
 *       200:
 *         description: Vehicle model found
 *       400:
 *         description: Id is required
 *       404:
 *         description: Vehicle model not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', 
    validate(vehicleModelValidator.findById),
    vehicleModelController.findById
);

/**
 * @swagger
 * /api/vehicle-model:
 *   post:
 *     tags: [Vehicle Model]
 *     summary: Create a new vehicle model
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               battery_type_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               avg_energy_usage:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Vehicle model created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
router.post('/', 
    verifyToken, 
    authorizeRole('admin'),
    validate(vehicleModelValidator.create), 
    vehicleModelController.create
);

/**
 * @swagger
 * /api/vehicle-model/{id}:
 *   put:
 *     tags: [Vehicle Model]
 *     summary: Update a vehicle model by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vehicle model ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               battery_type_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               avg_energy_usage:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Vehicle model updated
 *       400:
 *         description: Id is required
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Vehicle model not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
    // [
    //     vehicleModelRules.name.optional(),
    //     vehicleModelRules.brand.optional(),
    //     vehicleModelRules.avg_energy_usage.optional(),
    //     handleValidation
    // ],
    verifyToken, 
    authorizeRole('admin'), 
    validate(vehicleModelValidator.update),
    vehicleModelController.update);

/**
 * @swagger
 * /api/vehicle-model/{id}:
 *   delete:
 *     tags: [Vehicle Model]
 *     summary: Delete a vehicle model by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vehicle model ID
 *     responses:
 *       200:
 *         description: Vehicle model deleted successfully
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Vehicle model not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
    verifyToken, 
    authorizeRole('admin'), 
    validate(vehicleModelValidator.remove),
    vehicleModelController.remove);

module.exports = router;
