const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const transferValidator = require('../validations/transfer.validation');
const { validate } = require('../middlewares/validateHandler');

router.get('/', 
    verifyToken,
    authorizeRole('admin', 'staff'),
    transferController.findAll
);

router.get('/:id', 
    verifyToken,
    authorizeRole('admin', 'staff'),
    validate(transferValidator.findById), 
    transferController.findById
);

router.post('/request', 
    verifyToken,
    authorizeRole('staff'), 
    validate(transferValidator.request), 
    transferController.request
);

router.post('/:transfer_request_id/approve', 
    verifyToken, 
    authorizeRole('admin'), 
    validate(transferValidator.approve), 
    transferController.approve
);

router.post('/:transfer_request_id/reject',
    verifyToken,
    authorizeRole('admin'),
    validate(transferValidator.reject),
    transferController.reject
);

router.post('/:transfer_order_id/confirm', 
    verifyToken,
    authorizeRole('staff'), 
    validate(transferValidator.confirm), 
    transferController.confirm
);

router.post('/:transfer_request_id/cancel',
    verifyToken,
    authorizeRole('staff'),
    validate(transferValidator.cancel),
    transferController.cancel
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   - name: Transfers
 *     description: Manage battery transfer requests between stations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TransferRequest:
 *       type: object
 *       properties:
 *         transfer_request_id:
 *           type: string
 *           format: uuid
 *         station_id:
 *           type: integer
 *         staff_id:
 *           type: string
 *           format: uuid
 *         admin_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         request_quantity:
 *           type: integer
 *         request_time:
 *           type: string
 *           format: date-time
 *         resolve_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled, completed]
 *         notes:
 *           type: string
 *           nullable: true
 *     TransferOrder:
 *       type: object
 *       properties:
 *         transfer_order_id:
 *           type: string
 *           format: uuid
 *         transfer_request_id:
 *           type: string
 *           format: uuid
 *         source_station_id:
 *           type: integer
 *         target_station_id:
 *           type: integer
 *         staff_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         transfer_quantity:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [incomplete, completed]
 *         confirm_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         batteries:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               battery_id:
 *                 type: string
 *                 format: uuid
 *               current_soc:
 *                 type: number
 */

/**
 * @swagger
 * /api/transfers:
 *   get:
 *     tags: [Transfers]
 *     summary: Get all transfer requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all transfer requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   type: object
 *                   properties:
 *                     transfers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TransferRequest'
 *
 * /api/transfers/{id}:
 *   get:
 *     tags: [Transfers]
 *     summary: Get a transfer request by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transfer request details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   type: object
 *                   properties:
 *                     transfer:
 *                       $ref: '#/components/schemas/TransferRequest'
 *       404:
 *         description: Transfer request not found
 *
 * /api/transfers/request:
 *   post:
 *     tags: [Transfers]
 *     summary: Staff creates a new transfer request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - request_quantity
 *             properties:
 *               request_quantity:
 *                 type: integer
 *                 example: 10
 *               notes:
 *                 type: string
 *                 example: "Need 10 batteries for high usage hours"
 *     responses:
 *       200:
 *         description: Transfer request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   type: object
 *                   properties:
 *                     transferRequest:
 *                       $ref: '#/components/schemas/TransferRequest'
 *
 * /api/transfers/{transfer_request_id}/approve:
 *   post:
 *     tags: [Transfers]
 *     summary: Admin approves a transfer request and assigns transfer orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transfer_request_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transfer_orders
 *             properties:
 *               transfer_orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - source_station_id
 *                     - target_station_id
 *                     - transfer_quantity
 *                   properties:
 *                     source_station_id:
 *                       type: integer
 *                       description: ID of the station sending batteries
 *                     target_station_id:
 *                       type: integer
 *                       description: ID of the station receiving batteries
 *                     transfer_quantity:
 *                       type: integer
 *                       description: Number of batteries to transfer
 *     responses:
 *       200:
 *         description: Transfer approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   type: object
 *                   properties:
 *                     transfer_request:
 *                       $ref: '#/components/schemas/TransferRequest'
 *                     transfer_orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           order:
 *                             $ref: '#/components/schemas/TransferOrder'
 *                           transfer_battery_ids:
 *                             type: array
 *                             items:
 *                               type: integer
 *
 * /api/transfers/{transfer_request_id}/reject:
 *   post:
 *     tags: [Transfers]
 *     summary: Admin rejects a transfer request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transfer_request_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transfer request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   type: object
 *                   properties:
 *                     transferRequest:
 *                       $ref: '#/components/schemas/TransferRequest'
 *
 * /api/transfers/{transfer_order_id}/confirm:
 *   post:
 *     tags: [Transfers]
 *     summary: Staff confirms receipt of a transfer order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transfer_order_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transfer order confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   type: object
 *                   properties:
 *                     transferOrder:
 *                       $ref: '#/components/schemas/TransferOrder'
 *
 * /api/transfers/{transfer_request_id}/cancel:
 *   post:
 *     tags: [Transfers]
 *     summary: Staff cancels a pending transfer request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transfer_request_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transfer request cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   type: object
 *                   properties:
 *                     transferRequest:
 *                       $ref: '#/components/schemas/TransferRequest'
 */

