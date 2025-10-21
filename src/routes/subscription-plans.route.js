const express = require('express');
const router = express.Router();
const subscriptionPlanController = require('../controllers/subscriptionPlan.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const subscriptionPlanValidator = require('../validations/subscriptionPlan.validation');
const { validate } = require('../middlewares/validateHandler');

router.get('/',
	subscriptionPlanController.findAll
);

router.get('/:id',
	validate(subscriptionPlanValidator.findById),
	subscriptionPlanController.findById
);

router.post('/',
	verifyToken,
	authorizeRole('admin'),
	validate(subscriptionPlanValidator.create),
	subscriptionPlanController.create
);

router.put('/:id',
	verifyToken,
	authorizeRole('admin'),
	validate(subscriptionPlanValidator.update),
	subscriptionPlanController.update
);

router.put('/:id/status',
	verifyToken,
	authorizeRole('admin'),
	validate(subscriptionPlanValidator.updateStatus),
	subscriptionPlanController.updateStatus
);

router.delete('/:id',
	verifyToken,
	authorizeRole('admin'),
	validate(subscriptionPlanValidator.remove),
	subscriptionPlanController.remove
);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionPlan:
 *       type: object
 *       properties:
 *         plan_id:
 *           type: integer
 *           example: 1
 *         admin_id:
 *           type: string
 *           format: uuid
 *           example: "d290f1ee-6c54-4b01-90e6-d701748f0851"
 *         plan_name:
 *           type: string
 *           example: "Standard Plan"
 *         plan_fee:
 *           type: number
 *           format: float
 *           example: 49.99
 *         battery_cap:
 *           type: integer
 *           example: 100
 *         usage_cap:
 *           type: number
 *           format: float
 *           example: 200.5
 *         description:
 *           type: string
 *           example: "This is a basic subscription plan"
 *         is_active:
 *           type: boolean
 *           example: true
 *     SubscriptionPlanCreate:
 *       type: object
 *       required:
 *         - plan_fee
 *         - battery_cap
 *         - usage_cap
 *       properties:
 *         plan_name:
 *           type: string
 *           maxLength: 100
 *           example: "Standard Plan"
 *         plan_fee:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 49.99
 *         battery_cap:
 *           type: integer
 *           minimum: 0
 *           example: 100
 *         usage_cap:
 *           type: number
 *           minimum: 0
 *           example: 200.5
 *         description:
 *           type: string
 *           example: "This is a basic subscription plan"
 *         is_active:
 *           type: boolean
 *           default: true
 *     SubscriptionPlanUpdate:
 *       type: object
 *       properties:
 *         plan_name:
 *           type: string
 *           maxLength: 100
 *           example: "Updated Plan Name"
 *         plan_fee:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 59.99
 *         battery_cap:
 *           type: integer
 *           minimum: 0
 *           example: 120
 *         usage_cap:
 *           type: number
 *           minimum: 0
 *           example: 250.0
 *         description:
 *           type: string
 *           example: "Updated description"
 */

/**
 * @swagger
 * /api/subscription-plan:
 *   get:
 *     tags: [Subscription Plans]
 *     summary: Get all subscription plans
 *     responses:
 *       200:
 *         description: List of subscription plans
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
 *                     subscriptionPlans:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubscriptionPlan'
 */

/**
 * @swagger
 * /api/subscription-plan/{id}:
 *   get:
 *     tags: [Subscription Plans]
 *     summary: Get subscription plan by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription plan found
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
 *                     subscriptionPlan:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 *       404:
 *         description: Subscription plan not found
 */

/**
 * @swagger
 * /api/subscription-plan:
 *   post:
 *     tags: [Subscription Plans]
 *     summary: Create a new subscription plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionPlanCreate'
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
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
 *                     subscriptionPlan:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/subscription-plan/{id}:
 *   put:
 *     tags: [Subscription Plans]
 *     summary: Update a subscription plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionPlanUpdate'
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
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
 *                     subscriptionPlan:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Subscription plan not found
 */

/**
 * @swagger
 * /api/subscription-plan/{id}/status:
 *   put:
 *     tags: [Subscription Plans]
 *     summary: Toggle subscription plan status
 *     description: Activate or deactivate a subscription plan by toggling its is_active field.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *                     subscriptionPlan:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Subscription plan not found
 */

/**
 * @swagger
 * /api/subscription-plan/{id}:
 *   delete:
 *     tags: [Subscription Plans]
 *     summary: Delete a subscription plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
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
 *                     subscriptionPlan:
 *                       $ref: '#/components/schemas/SubscriptionPlan'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Subscription plan not found
 */

