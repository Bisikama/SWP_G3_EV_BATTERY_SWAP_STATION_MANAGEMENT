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
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

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
router.post('/create-from-subscription',verifyToken, invoiceController.createInvoiceFromSubscription);

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
router.get('/', verifyToken, invoiceController.getAllInvoices);

/**
 * @swagger
 * /api/invoice/payment-history/{vehicle_id}:
 *   get:
 *     tags: [Invoice]
 *     summary: Get payment history by vehicle ID
 *     description: |
 *       Retrieves the complete payment history for a specific vehicle, including:
 *       - All paid invoices (status = 'paid' only)
 *       - Related subscription information
 *       - Payment records for each invoice
 *       - Vehicle and driver details
 *       
 *       **Data includes:**
 *       - Vehicle information (license plate, model, driver)
 *       - Invoice details (amount, dates, status)
 *       - Subscription details (plan, duration, swap count, SOH usage)
 *       - Payment records (method, amount, transaction ID, payment time)
 *       
 *       **Sorting:**
 *       - Invoices are sorted by issue_date (newest first)
 *       - Payment records within each invoice sorted by payment_time (newest first)
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the vehicle
 *         example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
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
 *                   example: "Payment history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         vehicle_id:
 *                           type: string
 *                           format: uuid
 *                         license_plate:
 *                           type: string
 *                           example: "30A-12345"
 *                         model_name:
 *                           type: string
 *                           example: "VinFast VF e34"
 *                         driver:
 *                           type: object
 *                           properties:
 *                             fullname:
 *                               type: string
 *                             email:
 *                               type: string
 *                             phone_number:
 *                               type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_paid_invoices:
 *                           type: integer
 *                           example: 5
 *                         total_amount_paid:
 *                           type: number
 *                           example: 2500000
 *                     payment_history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           invoice_id:
 *                             type: string
 *                             format: uuid
 *                           total_amount:
 *                             type: number
 *                           subscription:
 *                             type: object
 *                             properties:
 *                               plan_name:
 *                                 type: string
 *                               swap_count:
 *                                 type: integer
 *                               soh_usage:
 *                                 type: number
 *                           payment_records:
 *                             type: array
 *                             items:
 *                               type: object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/invoice/payment-history/driver/{driver_id}:
 *   get:
 *     tags: [Invoice]
 *     summary: Get payment history for all vehicles of a driver
 *     description: |
 *       Retrieves the complete payment history for all vehicles owned by a specific driver, including:
 *       - All paid invoices (status = 'paid' only)
 *       - Related subscription information for each vehicle
 *       - Payment records for each invoice
 *       - Driver and vehicle details
 *       
 *       **Data includes:**
 *       - Driver information (fullname, email, phone)
 *       - List of all vehicles with their payment history
 *       - Invoice details (amount, dates, status) per vehicle
 *       - Subscription details (plan, duration, swap count, SOH usage)
 *       - Payment records (method, amount, transaction ID, payment date)
 *       - Summary statistics (total vehicles, total invoices, total amount paid)
 *       
 *       **Grouping:**
 *       - Results are grouped by vehicle
 *       - Each vehicle has its own payment history and summary
 *       - Overall summary includes all vehicles
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the driver account
 *         example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
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
 *                   example: "Payment history for all vehicles retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       type: object
 *                       properties:
 *                         account_id:
 *                           type: string
 *                           format: uuid
 *                         fullname:
 *                           type: string
 *                           example: "Nguyen Van A"
 *                         email:
 *                           type: string
 *                           example: "nguyenvana@example.com"
 *                         phone_number:
 *                           type: string
 *                           example: "0912345678"
 *                     total_vehicles:
 *                       type: integer
 *                       example: 3
 *                       description: "Total number of vehicles owned by driver"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_paid_invoices:
 *                           type: integer
 *                           example: 12
 *                           description: "Total paid invoices across all vehicles"
 *                         total_amount_paid:
 *                           type: number
 *                           example: 6000000
 *                           description: "Total amount paid across all vehicles"
 *                     vehicles_payment_history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           vehicle:
 *                             type: object
 *                             properties:
 *                               vehicle_id:
 *                                 type: string
 *                                 format: uuid
 *                               license_plate:
 *                                 type: string
 *                                 example: "30A-12345"
 *                               model_name:
 *                                 type: string
 *                                 example: "VinFast VF e34"
 *                               battery_type_id:
 *                                 type: integer
 *                                 example: 1
 *                               battery_slot:
 *                                 type: integer
 *                                 example: 2
 *                           vehicle_summary:
 *                             type: object
 *                             properties:
 *                               total_paid_invoices:
 *                                 type: integer
 *                                 example: 4
 *                               total_amount_paid:
 *                                 type: number
 *                                 example: 2000000
 *                           payment_history:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 invoice_id:
 *                                   type: string
 *                                   format: uuid
 *                                 invoice_number:
 *                                   type: string
 *                                   example: "INV-20251020-12345"
 *                                 create_date:
 *                                   type: string
 *                                   format: date
 *                                 plan_fee:
 *                                   type: number
 *                                   example: 500000
 *                                 total_swap_fee:
 *                                   type: number
 *                                   example: 0
 *                                 total_penalty_fee:
 *                                   type: number
 *                                   example: 0
 *                                 total_amount:
 *                                   type: number
 *                                   example: 500000
 *                                 payment_status:
 *                                   type: string
 *                                   example: "paid"
 *                                 subscription:
 *                                   type: object
 *                                   properties:
 *                                     subscription_id:
 *                                       type: string
 *                                       format: uuid
 *                                     plan_name:
 *                                       type: string
 *                                       example: "Gói Cơ Bản"
 *                                     plan_fee:
 *                                       type: number
 *                                       example: 500000
 *                                     duration_days:
 *                                       type: integer
 *                                       example: 30
 *                                     start_date:
 *                                       type: string
 *                                       format: date
 *                                     end_date:
 *                                       type: string
 *                                       format: date
 *                                     subscription_status:
 *                                       type: string
 *                                       example: "active"
 *                                     swap_count:
 *                                       type: integer
 *                                       example: 15
 *                                     soh_usage:
 *                                       type: number
 *                                       example: 12.5
 *                                 payment_records:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       payment_id:
 *                                         type: string
 *                                         format: uuid
 *                                       payment_method:
 *                                         type: string
 *                                         example: "momo"
 *                                       amount:
 *                                         type: number
 *                                         example: 500000
 *                                       payment_date:
 *                                         type: string
 *                                         format: date-time
 *                                       transaction_num:
 *                                         type: string
 *                                         example: "MOMO123456789"
 *                                       payment_status:
 *                                         type: string
 *                                         example: "completed"
 *       400:
 *         description: Bad request - driver_id is required
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
 *                   example: "driver_id is required"
 *       403:
 *         description: Account is not a driver
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
 *                   example: "Account is not a driver"
 *       404:
 *         description: Driver not found
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
 *                   example: "Driver not found"
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
 */
// Lấy lịch sử thanh toán theo driver_id (tất cả xe của driver) - ĐẶT TRƯỚC để tránh conflict
router.get('/payment-history/driver/:driver_id', verifyToken, invoiceController.getPaymentHistoryByDriver);

// Lấy lịch sử thanh toán theo vehicle_id
router.get('/payment-history/:vehicle_id', verifyToken, invoiceController.getPaymentHistoryByVehicle);

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
router.get('/:invoice_id', verifyToken , invoiceController.getInvoiceById);

module.exports = router;

