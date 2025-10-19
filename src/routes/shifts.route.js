const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const shiftValidator = require('../validations/shift.validation');
const { validate } = require('../middlewares/validateHandler');

router.get('/', 
    shiftController.findAll
);

router.get('/:id', 
    validate(shiftValidator.findById), 
    shiftController.findById
);

router.post('/', 
    verifyToken, 
    authorizeRole('admin'), 
    validate(shiftValidator.create), 
    shiftController.create
);

router.put('/:id', 
    verifyToken, 
    authorizeRole('admin'), 
    validate(shiftValidator.update), 
    shiftController.update
);

router.put('/:id/cancel', 
    verifyToken, 
    authorizeRole('admin'), 
    validate(shiftValidator.cancel), 
    shiftController.cancel
);

router.put('/:id/confirm', 
    verifyToken, 
    authorizeRole('staff'), 
    validate(shiftValidator.confirm), 
    shiftController.confirm
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: API for managing staff shifts at battery swap stations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Shift:
 *       type: object
 *       properties:
 *         shift_id:
 *           type: string
 *           format: uuid
 *           example: "f5b7b480-4d0a-4af9-82b9-cb7a69cbf4c0"
 *         admin_id:
 *           type: string
 *           format: uuid
 *           example: "aa7df30b0-1a4f-46ef-bb83-f0223bdf23bb"
 *         staff_id:
 *           type: string
 *           format: uuid
 *           example: "d12f30b0-1a4f-46ef-bb83-f0223bdf2371"
 *         station_id:
 *           type: integer
 *           example: 12
 *         start_time:
 *           type: string
 *           format: date-time
 *           example: "2025-10-20T08:00:00.000Z"
 *         end_time:
 *           type: string
 *           format: date-time
 *           example: "2025-10-20T16:00:00.000Z"
 *         status:
 *           type: string
 *           enum: [assigned, confirmed, cancelled]
 *           example: "assigned"
 */

/**
 * @swagger
 * /api/shift:
 *   get:
 *     summary: Get all shifts
 *     tags: [Shifts]
 *     responses:
 *       200:
 *         description: List of all shifts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Shift'
 */

/**
 * @swagger
 * /api/shift/{shift_id}:
 *   get:
 *     summary: Get a shift by ID
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: shift_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       404:
 *         description: Shift not found
 */

/**
 * @swagger
 * /api/shift:
 *   post:
 *     summary: Create a new shift (admin only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [staff_id, station_id, start_time, end_time]
 *             properties:
 *               staff_id:
 *                 type: string
 *                 format: uuid
 *                 example: "d12f30b0-1a4f-46ef-bb83-f0223bdf2371"
 *               station_id:
 *                 type: integer
 *                 example: 12
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-20T08:00:00.000Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-20T16:00:00.000Z"
 *     responses:
 *       201:
 *         description: Shift created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Validation error or related entity not found
 *       403:
 *         description: Only admins can create shifts
 */

/**
 * @swagger
 * /api/shift/{shift_id}:
 *   put:
 *     summary: Update a shift (admin only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shift_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staff_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Validation error or related entity not found
 *       403:
 *         description: Only the shift admin can update
 *       404:
 *         description: Shift not found
 */

/**
 * @swagger
 * /api/shift/{shift_id}/cancel:
 *   put:
 *     summary: Cancel a shift (admin only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shift_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       403:
 *         description: Only the shift admin can cancel
 *       404:
 *         description: Shift not found
 */

/**
 * @swagger
 * /api/shift/{shift_id}/confirm:
 *   put:
 *     summary: Confirm a shift (staff only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shift_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       403:
 *         description: Only assigned staff can confirm
 *       404:
 *         description: Shift not found
 */
