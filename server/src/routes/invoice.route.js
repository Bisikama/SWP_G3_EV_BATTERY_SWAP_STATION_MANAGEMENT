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
 *     summary: Create invoice from subscription
 *     description: Create a new invoice based on subscription information. Automatically fetches subscription details (plan, driver, vehicle) and generates invoice with unique invoice number, due date (30 days), and total fee from subscription plan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription_id
 *             properties:
 *               subscription_id:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: UUID of the subscription to create invoice from
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
 *                   example: Invoice created successfully
 *                 data:
 *                   $ref: '#/components/schemas/InvoiceWithDetails'
 *       400:
 *         description: Bad request - missing or invalid subscription_id, subscription has no plan, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: subscription_id is required
 *       404:
 *         description: Subscription not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Subscription not found
 *       409:
 *         description: Invoice already exists for this subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An invoice already exists for this subscription
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while creating the invoice
 */
// Tạo invoice từ subscription
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

