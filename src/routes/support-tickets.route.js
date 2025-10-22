const express = require('express');
const router = express.Router();
const supportTicketController = require('../controllers/supportTicket.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const supportTicketValidator = require('../validations/supportTicket.validation');
const { validate } = require('../middlewares/validateHandler');

router.get('/', 
    supportTicketController.findAll
);

router.get('/:id', 
    validate(supportTicketValidator.findById), 
    supportTicketController.findById
);

router.get('/creator/:id', 
    validate(supportTicketValidator.findByCreator), 
    supportTicketController.findByCreator
);

router.get('/resolver/:id', 
    validate(supportTicketValidator.findByResolver), 
    supportTicketController.findByResolver
);

router.post('/', 
    verifyToken,
    authorizeRole('driver'), 
    validate(supportTicketValidator.create), 
    supportTicketController.create
);

router.put('/:id/resolve', 
    verifyToken, 
    authorizeRole('admin'), 
    validate(supportTicketValidator.updateStatus), 
    supportTicketController.updateStatus
);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: SupportTickets
 *   description: API for managing customer support tickets between drivers and admins
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SupportTicket:
 *       type: object
 *       properties:
 *         ticket_id:
 *           type: string
 *           format: uuid
 *           example: "f5b7b480-4d0a-4af9-82b9-cb7a69cbf4c0"
 *         driver_id:
 *           type: string
 *           format: uuid
 *           example: "d12f30b0-1a4f-46ef-bb83-f0223bdf2371"
 *         admin_id:
 *           type: string
 *           format: uuid
 *           example: "aa7df30b0-1a4f-46ef-bb83-f0223bdf23bb"
 *         subject:
 *           type: string
 *           enum: [battery_issue, vehicle_issue, station_issue, account_issue, payment_issue, other]
 *           example: "vehicle_issue"
 *         description:
 *           type: string
 *           example: "The scooter battery drains unusually fast after full charge."
 *         status:
 *           type: string
 *           enum: [pending, resolved]
 *           example: "pending"
 *         create_date:
 *           type: string
 *           format: date-time
 *         resolve_date:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/support-ticket:
 *   get:
 *     summary: Get all support tickets
 *     tags: [SupportTickets]
 *     responses:
 *       200:
 *         description: List of all support tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 */

/**
 * @swagger
 * /api/support-ticket/{id}:
 *   get:
 *     summary: Get support ticket by ID
 *     tags: [SupportTickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The support ticket ID
 *     responses:
 *       200:
 *         description: Support ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: Support ticket not found
 */

/**
 * @swagger
 * /api/support-ticket/creator/{id}:
 *   get:
 *     summary: Get all support tickets created by a driver
 *     tags: [SupportTickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The driver's account ID
 *     responses:
 *       200:
 *         description: List of tickets created by the driver
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: No tickets found for this driver
 */

/**
 * @swagger
 * /api/support-ticket/resolver/{id}:
 *   get:
 *     summary: Get all support tickets assigned to an admin
 *     tags: [SupportTickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The admin's account ID
 *     responses:
 *       200:
 *         description: List of tickets assigned to the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: No tickets found for this admin
 */

/**
 * @swagger
 * /api/support-ticket:
 *   post:
 *     summary: Create a new support ticket
 *     tags: [SupportTickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, description]
 *             properties:
 *               subject:
 *                 type: string
 *                 enum: [battery_issue, vehicle_issue, station_issue, account_issue, payment_issue, other]
 *                 example: "station_issue"
 *               description:
 *                 type: string
 *                 example: "Charging station #12 does not start charging even after scanning QR."
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Validation error or duplicate pending ticket
 *       403:
 *         description: Only drivers can create tickets
 *       500:
 *         description: No available admin to assign this ticket
 */

/**
 * @swagger
 * /api/support-ticket/{id}/resolve:
 *   put:
 *     summary: Resolve a pending support ticket (admin only)
 *     tags: [SupportTickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The support ticket ID
 *     responses:
 *       200:
 *         description: Ticket resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Only pending tickets can be resolved
 *       403:
 *         description: You cannot resolve tickets assigned to another admin
 *       404:
 *         description: Support ticket not found
 */
