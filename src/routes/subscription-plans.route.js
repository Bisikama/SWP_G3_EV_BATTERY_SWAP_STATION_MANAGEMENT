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
 * tags:
 *   - name: Subscription Plans
 *     description: Manage subscription plans
 */

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
 *         swap_fee:
 *           type: number
 *           format: float
 *           example: 9.99
 *         penalty_fee:
 *           type: number
 *           format: float
 *           example: 49.99
 *         soh_cap:
 *           type: number
 *           format: float
 *           example: 0.1
 *         duration_days:
 *           type: integer
 *           example: 30
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
 *         - swap_fee
 *         - penalty_fee
 *         - soh_cap
 *         - duration_days
 *       properties:
 *         plan_name:
 *           type: string
 *           maxLength: 100
 *           example: "Standard Plan"
 *         plan_fee:
 *           type: number
 *           format: float
 *           example: 49.99
 *         swap_fee:
 *           type: number
 *           format: float
 *           example: 9.99
 *         penalty_fee:
 *           type: number
 *           format: float
 *           example: 49.99
 *         soh_cap:
 *           type: number
 *           format: float
 *           example: 0.1
 *         duration_days:
 *           type: integer
 *           example: 30
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
 *           example: "Updated Plan"
 *         plan_fee:
 *           type: number
 *           format: float
 *           example: 59.99
 *         swap_fee:
 *           type: number
 *           format: float
 *           example: 9.99
 *         penalty_fee:
 *           type: number
 *           format: float
 *           example: 49.99
 *         soh_cap:
 *           type: number
 *           format: float
 *           example: 0.1
 *         duration_days:
 *           type: integer
 *           example: 30
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
 *                 payload:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionPlan'
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
 *                 payload:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 */

/**
 * @swagger
 * /api/subscription-plan/{id}:
 *   get:
 *     tags: [Subscription Plans]
 *     summary: Get a subscription plan by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                 payload:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 *       404:
 *         description: Subscription plan not found
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
 *                   $ref: '#/components/schemas/SubscriptionPlan'
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
 *     responses:
 *       200:
 *         description: Subscription plan deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 * /api/subscription-plan/{id}/status:
 *   put:
 *     tags: [Subscription Plans]
 *     summary: Toggle subscription plan status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payload:
 *                   $ref: '#/components/schemas/SubscriptionPlan'
 */