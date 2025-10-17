const express = require('express');
const router = express.Router();
const stationController = require('../controllers/station.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const stationValidator = require('../validations/station.validation');
const { validate } = require('../middlewares/validateHandler');

router.get('/', 
    stationController.findAll
);

router.get('/:id', 
    validate(stationValidator.findById), 
    stationController.findById
);

router.post('/', 
    verifyToken, 
    authorizeRole('admin'), 
    validate(stationValidator.create), 
    stationController.create
);

router.put('/:id', 
    verifyToken, 
    authorizeRole('admin'), 
    validate(stationValidator.update), 
    stationController.update
);

router.delete('/:id', 
    verifyToken, 
    authorizeRole('admin'), 
    validate(stationValidator.remove), 
    stationController.remove
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Stations
 *   description: API endpoints for managing battery swap stations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Station:
 *       type: object
 *       properties:
 *         station_id:
 *           type: integer
 *           example: 1
 *         station_name:
 *           type: string
 *           example: "Downtown Battery Station"
 *         address:
 *           type: string
 *           example: "123 Electric Ave, Hanoi, Vietnam"
 *         latitude:
 *           type: number
 *           format: float
 *           example: 21.027764
 *         longitude:
 *           type: number
 *           format: float
 *           example: 105.834160
 *         status:
 *           type: string
 *           enum: [operational, maintenance, closed]
 *           example: operational
 *
 *     StationCreate:
 *       type: object
 *       required: [station_name, address, latitude, longitude]
 *       properties:
 *         station_name:
 *           type: string
 *           example: "New Battery Swap Station"
 *         address:
 *           type: string
 *           example: "45 Nguyen Trai, Ho Chi Minh City, Vietnam"
 *         latitude:
 *           type: number
 *           format: float
 *           example: 10.762622
 *         longitude:
 *           type: number
 *           format: float
 *           example: 106.660172
 *         status:
 *           type: string
 *           enum: [operational, maintenance, closed]
 *           example: operational
 *
 *     StationUpdate:
 *       type: object
 *       properties:
 *         station_name:
 *           type: string
 *           example: "Updated Station Name"
 *         address:
 *           type: string
 *           example: "99 Vo Van Tan, District 3"
 *         latitude:
 *           type: number
 *           format: float
 *           example: 10.773
 *         longitude:
 *           type: number
 *           format: float
 *           example: 106.682
 *         status:
 *           type: string
 *           enum: [operational, maintenance, closed]
 *           example: maintenance
 */

/**
 * @swagger
 * /api/station:
 *   get:
 *     tags: [Stations]
 *     summary: Get all stations
 *     description: Retrieve a list of all battery swap stations.
 *     responses:
 *       200:
 *         description: List of stations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payload:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Station'
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/station/{id}:
 *   get:
 *     tags: [Stations]
 *     summary: Get a station by ID
 *     description: Retrieve details of a specific station by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Station ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Station retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payload:
 *                   $ref: '#/components/schemas/Station'
 *       404:
 *         description: Station not found
 *       400:
 *         description: Invalid ID format
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/station:
 *   post:
 *     tags: [Stations]
 *     summary: Create a new station
 *     description: Only administrators can create a new battery swap station.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StationCreate'
 *     responses:
 *       201:
 *         description: Station created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payload:
 *                   $ref: '#/components/schemas/Station'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/station/{id}:
 *   put:
 *     tags: [Stations]
 *     summary: Update a station
 *     description: Update details of an existing station. Only administrators can update.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Station ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StationUpdate'
 *     responses:
 *       200:
 *         description: Station updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payload:
 *                   $ref: '#/components/schemas/Station'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Station not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/station/{id}:
 *   delete:
 *     tags: [Stations]
 *     summary: Delete a station
 *     description: Delete a station by ID. Only administrators can delete.  
 *       Deletion is not allowed if the station has linked cabinets, shifts, or bookings.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Station ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Station deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Station not found
 *       409:
 *         description: Cannot delete station because linked resources exist
 *       500:
 *         description: Internal server error
 */
