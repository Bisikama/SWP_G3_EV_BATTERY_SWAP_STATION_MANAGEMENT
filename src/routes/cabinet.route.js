const express = require('express');
const router = express.Router();
const cabinetController = require('../controllers/cabinet.controller');
const cabinetValidator = require('../validations/cabinet.validation');
const { validate } = require('../middlewares/validateHandler');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

/**
 * @swagger
 * tags:
 *   name: Cabinets
 *   description: Cabinet management endpoints
 */

/**
 * @swagger
 * /api/cabinets:
 *   get:
 *     summary: Get all cabinets (supports pagination)
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page (default 10)
 *     responses:
 *       200:
 *         description: List of cabinets
 */
router.get('/',
  verifyToken,
  authorizeRole('admin', 'staff'),
  validate(cabinetValidator.findAll),
  cabinetController.findAll
);

/**
 * @swagger
 * /api/cabinets:
 *   post:
 *     summary: Create a new cabinet
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               station_id:
 *                 type: integer
 *                 example: 1
 *               battery_capacity:
 *                 type: integer
 *                 example: 10
 *               power_capacity_kw:
 *                 type: number
 *                 example: 50
 *             required:
 *               - station_id
 *               - battery_capacity
 *               - power_capacity_kw
 *     responses:
 *       201:
 *         description: Cabinet created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Station not found
 */
router.post('/',
  verifyToken,
  authorizeRole('admin'),
  validate(cabinetValidator.create),
  cabinetController.create
);

/**
 * @swagger
 * /api/cabinets/{id}:
 *   get:
 *     summary: Get cabinet by ID
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cabinet object
 *       404:
 *         description: Cabinet not found
 */
router.get('/:id',
  verifyToken,
  authorizeRole('admin', 'staff'),
  validate(cabinetValidator.findById),
  cabinetController.findById
);

/**
 * @swagger
 * /api/cabinets/station/{station_id}:
 *   get:
 *     summary: Get all cabinets by station (supports pagination)
 *     tags: [Cabinets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page (default 10)
 *     responses:
 *       200:
 *         description: List of cabinets
 */
router.get('/station/:station_id',
  verifyToken,
  authorizeRole('admin', 'staff'),
  validate(cabinetValidator.findByStation),
  cabinetController.findByStation
);

/**
 * @swagger
 * /api/cabinets/{id}/charge-full:
 *   put:
 *     summary: Charge all batteries in a cabinet to full (simulation)
 *     tags: [Cabinets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Batteries charged to full
 */
router.put('/:id/charge-full',
  validate(cabinetValidator.chargeFull),
  cabinetController.chargeFull
);

module.exports = router;
