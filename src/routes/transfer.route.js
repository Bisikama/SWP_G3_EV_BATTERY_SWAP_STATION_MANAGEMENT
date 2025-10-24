const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const transferValidator = require('../validations/transfer.validation');
const { validate } = require('../middlewares/validateHandler');

router.get('/', 
    transferController.findAll
);

router.get('/:id', 
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

router.post('/:transfer_detail_id/confirm', 
    verifyToken,
    authorizeRole('staff'), 
    validate(transferValidator.confirm), 
    transferController.confirm
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Transfers
 *   description: Manage battery transfer requests between stations
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
 *           example: "6b3b25c2-2b2b-4c6a-9b4e-9d621234abcd"
 *         station_id:
 *           type: integer
 *           example: 1
 *         staff_id:
 *           type: string
 *           format: uuid
 *           example: "a18b9e8c-4f3c-49c0-97e2-122ad0982cd1"
 *         admin_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "c6d2d08a-1344-423e-bc44-52a67c1b20a1"
 *         request_quantity:
 *           type: integer
 *           example: 12
 *         request_time:
 *           type: string
 *           format: date-time
 *         approve_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [pending, approved]
 *           example: "approved"
 *         notes:
 *           type: string
 *           nullable: true
 *           example: "Requesting additional batteries for upcoming demand"
 *
 *     TransferDetail:
 *       type: object
 *       properties:
 *         transfer_detail_id:
 *           type: string
 *           format: uuid
 *           example: "09c2b6e8-7e89-46f4-a2b7-bd74af1aab21"
 *         transfer_request_id:
 *           type: string
 *           format: uuid
 *         station_id:
 *           type: integer
 *           example: 2
 *         staff_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         transfer_quantity:
 *           type: integer
 *           example: 4
 *         status:
 *           type: string
 *           enum: [transfering, confirmed]
 *           example: "transfering"
 *         confirm_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /api/transfers:
 *   get:
 *     summary: Get all transfer requests
 *     tags: [Transfers]
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
 *                   example: true
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
 *     summary: Get a transfer request by ID
 *     tags: [Transfers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transfer request ID
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
 *
 * /api/transfers/request:
 *   post:
 *     summary: Staff creates a new transfer request
 *     security:
 *       - bearerAuth: []
 *     tags: [Transfers]
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
 *                     transferReq:
 *                       $ref: '#/components/schemas/TransferRequest'
 *
 * /api/transfers/{transfer_request_id}/approve:
 *   post:
 *     summary: Admin approves a transfer request and assigns details
 *     security:
 *       - bearerAuth: []
 *     tags: [Transfers]
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
 *               - transfer_details
 *             properties:
 *               transfer_details:
 *                 type: array
 *                 description: List of station transfer assignments
 *                 items:
 *                   type: object
 *                   properties:
 *                     station_id:
 *                       type: integer
 *                       example: 1
 *                     transfer_quantity:
 *                       type: integer
 *                       example: 4
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
 *                     transfer:
 *                       $ref: '#/components/schemas/TransferRequest'
 *
 * /api/transfers/{transfer_detail_id}/confirm:
 *   post:
 *     summary: Staff confirms receipt of a transfer
 *     security:
 *       - bearerAuth: []
 *     tags: [Transfers]
 *     parameters:
 *       - in: path
 *         name: transfer_detail_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transfer detail confirmed successfully
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
 *                     transferDetail:
 *                       $ref: '#/components/schemas/TransferDetail'
 */
