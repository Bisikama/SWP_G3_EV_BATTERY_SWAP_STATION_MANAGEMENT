const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authorizeRole, verifyToken } = require('../middlewares/verifyTokens');
const { validate } = require('../middlewares/validateHandler');
const subscriptionValidator = require('../validations/subscription.validation');

/**
 * @swagger
 * /api/subscription:
 *   get:
 *     tags: [Subscription]
 *     summary: Get all subscriptions
 *     responses:
 *       200:
 *         description: List of subscriptions
 *       500:
 *         description: Internal server error
 */
router.get('/', 
    subscriptionController.findAll
);

/**
 * @swagger
 * /api/subscription/id/{id}:
 *   get:
 *     tags: [Subscription]
 *     summary: Get a subscription by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.get('/id/:id', 
    validate(subscriptionValidator.findById),
    subscriptionController.findById
);

/**
 * @swagger
 * /api/subscription/vehicle/{vehicle_id}:
 *   get:
 *     tags: [Subscription]
 *     summary: Get a subscription by vehicle ID
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Subscription found
 *       400:
 *         description: Invalid vehicle ID
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.get('/vehicle/:vehicle_id', 
    validate(subscriptionValidator.findByVehicle),
    subscriptionController.findByVehicle
);

/**
 * @swagger
 * /api/subscription/driver/{driver_id}:
 *   get:
 *     tags: [Subscription]
 *     summary: Get a subscription by driver ID
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Subscription found
 *       400:
 *         description: Invalid driver ID
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.get('/driver/:driver_id', 
    validate(subscriptionValidator.findByDriver),
    subscriptionController.findByDriver
);

/**
 * @swagger
 * /api/subscription/active/{vehicle_id}:
 *   get:
 *     tags: [Subscription]
 *     summary: Get the current active subscription for a vehicle
 *     description: Retrieve the currently active subscription for a given vehicle. A subscription is considered active if it is not canceled and the current date is between its start and end dates.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Active subscription found
 *       400:
 *         description: Invalid vehicle ID
 *       403:
 *         description: You are not authorized to access this vehicle
 *       404:
 *         description: No active subscription found for this vehicle
 *       500:
 *         description: Internal server error
 */
router.get('/active/:vehicle_id', 
    verifyToken,
    authorizeRole('driver'),
    validate(subscriptionValidator.findActiveByVehicle),
    subscriptionController.findActiveByVehicle
);

/**
 * @swagger
 * /api/subscription:
 *   post:
 *     tags: [Subscription]
 *     summary: Create a new subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *               - plan_id
 *             properties:
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               plan_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Unauthorized to create subscription
 *       409:
 *         description: Vehicle already has active subscription
 *       500:
 *         description: Internal server error
 */
router.post('/',
    verifyToken, 
    authorizeRole('driver'), 
    validate(subscriptionValidator.create), 
    subscriptionController.create
);

/**
 * @swagger
 * /api/subscription/cancel/{id}:
 *   put:
 *     tags: [Subscription]
 *     summary: Cancel a subscription
 *     description: Cancel an active subscription by updating its status to "cancelled". Only the driver who owns the subscription can cancel it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Subscription ID to cancel
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
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
 *                     subscription_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: cancelled
 *       400:
 *         description: Subscription is already cancelled
 *       403:
 *         description: Unauthorized to cancel this subscription
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.put('/cancel/:id', 
    verifyToken, 
    authorizeRole('driver'),
    validate(subscriptionValidator.cancel), 
    subscriptionController.cancel
);

module.exports = router;
