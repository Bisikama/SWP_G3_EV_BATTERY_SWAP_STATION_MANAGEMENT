// ========================================
// PAYMENT ROUTES
// ========================================
// File: src/routes/payment.route.js
// Mục đích: Định nghĩa routes cho MoMo payment integration
// Base path: /api/payment
// ========================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/MOMO_payment.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: MoMo payment integration APIs
 */

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     tags: [Payment]
 *     summary: Create MoMo payment link
 *     security:
 *       - bearerAuth: []
 *     description: Generate a MoMo payment link for an invoice. Returns payUrl for user to complete payment. Only works with unpaid invoices.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoice_id
 *             properties:
 *               invoice_id:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: UUID of the invoice to pay
 *               plan_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the subscription plan associated with the invoice
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *                 description: UUID of the vehicle associated with the invoice
 *   
 *     responses:
 *       201:
 *         description: Payment link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     partnerCode:
 *                       type: string
 *                       example: MOMO
 *                     orderId:
 *                       type: string
 *                       example: INV_550e8400-e29b-41d4-a716-446655440000_1729345678000
 *                     requestId:
 *                       type: string
 *                     amount:
 *                       type: integer
 *                       example: 299000
 *                     responseTime:
 *                       type: integer
 *                     message:
 *                       type: string
 *                       example: Successful.
 *                     resultCode:
 *                       type: integer
 *                       example: 0
 *                     payUrl:
 *                       type: string
 *                       example: https://test-payment.momo.vn/v2/gateway/pay?t=TU9NT...
 *                       description: Redirect user to this URL to complete payment
 *                     deeplink:
 *                       type: string
 *                     qrCodeUrl:
 *                       type: string
 *       400:
 *         description: Bad request - missing invoice_id or invoice already paid
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
 *                   example: This invoice has already been paid
 *       404:
 *         description: Invoice not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invoice not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/payment/result:
 *   get:
 *     tags: [Payment]
 *     summary: Handle MoMo redirect result
 *     description: Endpoint where MoMo redirects user after payment. Displays payment result to user. Note - Database updates are handled by IPN endpoint, not this endpoint.
 *     parameters:
 *       - in: query
 *         name: resultCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Result code from MoMo (0 = success, others = failure)
 *         example: "0"
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (format INV_<invoice_id>_<timestamp>)
 *         example: INV_550e8400-e29b-41d4-a716-446655440000_1729345678000
 *       - in: query
 *         name: message
 *         schema:
 *           type: string
 *         description: Message from MoMo
 *       - in: query
 *         name: transId
 *         schema:
 *           type: string
 *         description: Transaction ID from MoMo
 *       - in: query
 *         name: amount
 *         schema:
 *           type: integer
 *         description: Payment amount
 *     responses:
 *       200:
 *         description: Payment successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment successful
 *                 orderId:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: All query parameters from MoMo
 *       400:
 *         description: Payment failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment failed
 *                 orderId:
 *                   type: string
 *                 data:
 *                   type: object
 */

/**
 * @swagger
 * /api/payment/ipn:
 *   post:
 *     tags: [Payment]
 *     summary: Handle MoMo IPN (Instant Payment Notification)
 *     description: |
 *       Webhook endpoint for MoMo to send payment results. This is where database updates happen:
 *       - Creates PaymentRecord with transaction details
 *       - Updates Invoice payment_status to 'paid'
 *       - Sets Invoice pay_date to current date
 *       - Sets Invoice due_date to pay_date + 1 month
 *       
 *       **Important:** This endpoint must be publicly accessible (use ngrok for local dev). MoMo cannot reach localhost URLs.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resultCode
 *               - orderId
 *               - amount
 *             properties:
 *               partnerCode:
 *                 type: string
 *                 example: MOMO
 *               orderId:
 *                 type: string
 *                 example: INV_550e8400-e29b-41d4-a716-446655440000_1729345678000
 *                 description: Format INV_<invoice_id>_<timestamp> - will be parsed to extract invoice_id
 *               requestId:
 *                 type: string
 *               amount:
 *                 type: integer
 *                 example: 299000
 *               orderInfo:
 *                 type: string
 *               orderType:
 *                 type: string
 *               transId:
 *                 type: string
 *                 example: "2547896321"
 *                 description: MoMo transaction ID - stored as transaction_num in PaymentRecord
 *               resultCode:
 *                 type: integer
 *                 example: 0
 *                 description: 0 = success, non-zero = failure
 *               message:
 *                 type: string
 *                 example: Successful.
 *               payType:
 *                 type: string
 *                 example: qr
 *                 description: Payment method type (qr, napas, credit, etc.)
 *               responseTime:
 *                 type: integer
 *               extraData:
 *                 type: string
 *               signature:
 *                 type: string
 *                 description: HMAC SHA256 signature for verification
 *     responses:
 *       204:
 *         description: IPN processed successfully (no content)
 *       400:
 *         description: Invalid orderId format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid orderId format
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
 *         description: Server error - MoMo will retry
 */

// ========================================
// ROUTE DEFINITIONS
// ========================================

// Tạo payment link
router.post('/create', verifyToken, paymentController.createPayment);

// Nhận kết quả từ redirect (user quay về sau khi thanh toán)
router.get('/result', paymentController.getPaymentResult);

// Nhận IPN (webhook) từ MoMo - để test trên Postman
router.post('/ipn', paymentController.handlePaymentIPN);


module.exports = router;