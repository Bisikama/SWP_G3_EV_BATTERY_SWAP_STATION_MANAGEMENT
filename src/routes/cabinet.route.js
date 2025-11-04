const express = require('express');
const router = express.Router();
const cabinetController = require('../controllers/cabinet.controller');
const cabinetValidator = require('../validations/cabinet.validation');
const { validate } = require('../middlewares/validateHandler');

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
  validate(cabinetValidator.findAll),
  cabinetController.findAll
);

/**
 * @swagger
 * /api/cabinets/{id}:
 *   get:
 *     summary: Get cabinet by ID
 *     tags: [Cabinets]
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
  validate(cabinetValidator.findById),
  cabinetController.findById
);

/**
 * @swagger
 * /api/cabinets/station/{station_id}:
 *   get:
 *     summary: Get all cabinets by station (supports pagination)
 *     tags: [Cabinets]
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
