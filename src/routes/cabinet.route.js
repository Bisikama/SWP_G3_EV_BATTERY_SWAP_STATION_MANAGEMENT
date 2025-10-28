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
 *     summary: Get all cabinets
 *     tags: [Cabinets]
 *     responses:
 *       200:
 *         description: List of cabinets
 */
router.get(
  '/',
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
router.get(
  '/:id',
  validate(cabinetValidator.findById),
  cabinetController.findById
);

/**
 * @swagger
 * /api/cabinets/station/{station_id}:
 *   get:
 *     summary: Get all cabinets by station
 *     tags: [Cabinets]
 *     parameters:
 *       - in: path
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of cabinets
 */
router.get(
  '/station/:station_id',
  validate(cabinetValidator.findByStation),
  cabinetController.findByStation
);

/**
 * @swagger
 * /api/cabinets/{cabinet_id}/empty-slots:
 *   get:
 *     summary: Get empty slots in a cabinet
 *     tags: [Cabinets]
 *     parameters:
 *       - in: path
 *         name: cabinet_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of empty slots
 */
router.get(
  '/:cabinet_id/empty-slots',
  validate(cabinetValidator.findEmptySlot),
  cabinetController.findEmptySlot
);

/**
 * @swagger
 * /api/cabinets/{cabinet_id}/charge-full:
 *   put:
 *     summary: Charge all batteries in a cabinet to full (simulation)
 *     tags: [Cabinets]
 *     parameters:
 *       - in: path
 *         name: cabinet_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Batteries charged to full
 */
router.put(
  '/:cabinet_id/charge-full',
  validate(cabinetValidator.chargeFull),
  cabinetController.chargeFull
);

module.exports = router;
