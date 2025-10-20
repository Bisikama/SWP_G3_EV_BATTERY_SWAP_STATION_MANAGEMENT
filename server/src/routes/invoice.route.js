// ========================================
// INVOICE ROUTES
// ========================================
// File: src/routes/invoice.route.js
// Mục đích: Định nghĩa routes cho invoice operations
// Base path: /api/invoice
// ========================================

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');

/**
 * @swagger
 * tags:
 *   name: Invoice
 *   description: Invoice management APIs
 */

/**
 * @swagger
 * /api/invoice/create-from-subscription:
 *   post:
 *     tags: [Invoice]
 *     summary: Create a new invoice for a vehicle and subscription plan
 *     description: |
 *       Creates a new invoice for purchasing a subscription plan for a vehicle.
 *       
 *       **Business Rules:**
 *       - The vehicle must NOT have any active subscription (regardless of plan)
 *       - Active subscription = end_date >= current date
 *       - If vehicle has an active subscription, it must be cancelled first
 *       - Each invoice is created with status 'unpaid'
 *       - Invoice number is auto-generated in format: INV-YYYYMMDD-XXXXX
 *       
 *       **After successful payment:**
 *       - Invoice status will be updated to 'paid'
 *       - A new Subscription will be created and linked to this invoice
 *       - Subscription will be set to 'active' status
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
 *                 description: UUID of the vehicle to purchase subscription for
 *                 example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *               plan_id:
 *                 type: integer
 *                 description: ID of the subscription plan to purchase
 *                 example: 1
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Invoice created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoice:
 *                       type: object
 *                       properties:
 *                         invoice_id:
 *                           type: string
 *                           format: uuid
 *                           example: "b1ffcd88-8c0b-4ef8-cc7e-7cc9ce491b22"
 *                         invoice_number:
 *                           type: string
 *                           example: "INV-20251020-12345"
 *                         create_date:
 *                           type: string
 *                           format: date
 *                           example: "2025-10-20"
 *                         pay_date:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                           example: null
 *                           description: "Will be set when payment is successful"
 *                         due_date:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                           example: null
 *                           description: "Will be set to pay_date + 1 month after payment"
 *                         total_fee:
 *                           type: integer
 *                           example: 500000
 *                           description: "Amount in VND (from subscription plan)"
 *                         payment_status:
 *                           type: string
 *                           enum: [unpaid, paid]
 *                           example: "unpaid"
 *                         driver:
 *                           type: object
 *                           properties:
 *                             driver_id:
 *                               type: string
 *                               format: uuid
 *                             fullname:
 *                               type: string
 *                               example: "Nguyen Van A"
 *                             email:
 *                               type: string
 *                               example: "driver@example.com"
 *                             phone_number:
 *                               type: string
 *                               example: "0123456789"
 *                     plan:
 *                       type: object
 *                       properties:
 *                         plan_id:
 *                           type: integer
 *                           example: 1
 *                         plan_name:
 *                           type: string
 *                           example: "Basic Plan"
 *                         plan_fee:
 *                           type: integer
 *                           example: 500000
 *                         battery_cap:
 *                           type: integer
 *                           example: 100
 *                           description: "Battery capacity limit"
 *                         usage_cap:
 *                           type: number
 *                           format: decimal
 *                           example: 1000.00
 *                           description: "Usage capacity limit"
 *                         description:
 *                           type: string
 *                           example: "Basic monthly subscription plan"
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         vehicle_id:
 *                           type: string
 *                           format: uuid
 *                         license_plate:
 *                           type: string
 *                           example: "29A-12345"
 *                         color:
 *                           type: string
 *                           example: "Red"
 *                         model_id:
 *                           type: integer
 *                           example: 1
 *       400:
 *         description: Bad request - Missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "vehicle_id and plan_id are required"
 *       404:
 *         description: Vehicle or Subscription Plan not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Vehicle not found"
 *             examples:
 *               vehicle_not_found:
 *                 value:
 *                   success: false
 *                   message: "Vehicle not found"
 *               plan_not_found:
 *                 value:
 *                   success: false
 *                   message: "Subscription plan not found"
 *       409:
 *         description: Conflict - Vehicle already has an active subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "This vehicle currently has an active subscription. Please cancel the existing subscription before creating a new invoice."
 *                 existing_subscription:
 *                   type: object
 *                   properties:
 *                     subscription_id:
 *                       type: string
 *                       format: uuid
 *                       example: "c2ffcd88-9d0c-5fg9-dd8f-8dd0df592c33"
 *                     plan_id:
 *                       type: integer
 *                       example: 1
 *                     plan_name:
 *                       type: string
 *                       example: "Basic Plan"
 *                     start_date:
 *                       type: string
 *                       format: date
 *                       example: "2025-01-01"
 *                     end_date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-01"
 *                     sub_status:
 *                       type: string
 *                       enum: [active, inactive]
 *                       example: "active"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */
// Tạo invoice từ vehicle_id và plan_id
router.post('/create-from-subscription', invoiceController.createInvoiceFromSubscription);

/**
 * @swagger
 * /api/invoice:
 *   get:
 *     tags: [Invoice]
 *     summary: Get all invoices
 *     description: Retrieve all invoices with full details including driver, subscription, plan, and vehicle information. Results are ordered by create date (newest first).
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InvoiceWithDetails'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching invoices
 */
// Lấy tất cả invoices (optional - để test)
router.get('/', invoiceController.getAllInvoices);

/**
 * @swagger
 * /api/invoice/{invoice_id}:
 *   get:
 *     tags: [Invoice]
 *     summary: Get invoice by ID
 *     description: Retrieve a specific invoice by its UUID with full details including driver, subscription, plan, and vehicle information.
 *     parameters:
 *       - in: path
 *         name: invoice_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the invoice to retrieve
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InvoiceWithDetails'
 *       404:
 *         description: Invoice not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invoice not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching the invoice
 */
// Lấy invoice theo ID
router.get('/:invoice_id', invoiceController.getInvoiceById);

module.exports = router;

