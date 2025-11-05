const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const transferValidator = require('../validations/transfer.validation');
const { validate } = require('../middlewares/validateHandler');

router.get('/request', 
    verifyToken,
    authorizeRole('admin', 'staff'),
    validate(transferValidator.findAllRequest),
    transferController.findAllRequest
);

router.get('/order', 
    verifyToken,
    authorizeRole('admin', 'staff'),
    validate(transferValidator.findAllOrder),
    transferController.findAllOrder
);

router.get('/request/:id', 
    verifyToken,
    authorizeRole('admin', 'staff'),
    validate(transferValidator.findRequestById), 
    transferController.findRequestById
);

router.get('/order/:id', 
    verifyToken,
    authorizeRole('admin', 'staff'),
    validate(transferValidator.findOrderById), 
    transferController.findOrderById
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

router.post('/create',
    verifyToken,
    authorizeRole('admin'),
    validate(transferValidator.create),
    transferController.create
)

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
 *     description: Manage battery transfer requests and orders between stations
 *
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
 * /api/transfers/request:
 *   get:
 *     tags: [Transfers]
 *     summary: Get all transfer requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: station_id
 *         schema:
 *           type: integer
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
 */

/**
 * @swagger
 * /api/transfers/order:
 *   get:
 *     tags: [Transfers]
 *     summary: Get all transfer orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: source_station_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: target_station_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of all transfer orders
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TransferOrder'
 */

/**
 * @swagger
 * /api/transfers/request/{id}:
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
 *                   $ref: '#/components/schemas/TransferRequest'
 *       404:
 *         description: Transfer request not found
 */

/**
 * @swagger
 * /api/transfers/order/{id}:
 *   get:
 *     tags: [Transfers]
 *     summary: Get a transfer order by ID
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
 *         description: Transfer order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   $ref: '#/components/schemas/TransferOrder'
 *       404:
 *         description: Transfer order not found
 */

/**
 * @swagger
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
 *               notes:
 *                 type: string
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
 *                   $ref: '#/components/schemas/TransferRequest'
 */

/**
 * @swagger
 * /api/transfers/create:
 *   post:
 *     tags: [Transfers]
 *     summary: Admin creates transfer orders directly
 *     security:
 *       - bearerAuth: []
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
 *                     target_station_id:
 *                       type: integer
 *                     transfer_quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Transfer orders created successfully
 */

/**
 * @swagger
 * /api/transfers/{transfer_request_id}/approve:
 *   post:
 *     tags: [Transfers]
 *     summary: Admin approves a transfer request
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
 *                     target_station_id:
 *                       type: integer
 *                     transfer_quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Transfer request approved successfully
 */

/**
 * @swagger
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
 */

/**
 * @swagger
 * /api/transfers/{transfer_order_id}/confirm:
 *   post:
 *     tags: [Transfers]
 *     summary: Staff confirms a transfer order
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
 */

/**
 * @swagger
 * /api/transfers/{transfer_request_id}/cancel:
 *   post:
 *     tags: [Transfers]
 *     summary: Staff cancels a transfer request
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
 */