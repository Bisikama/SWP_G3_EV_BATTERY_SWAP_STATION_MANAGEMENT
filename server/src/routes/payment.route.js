const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/MOMO_payment.controller');

// Tạo payment link
router.post('/create', paymentController.createPayment);

// Nhận kết quả từ redirect (user quay về sau khi thanh toán)
router.get('/result', paymentController.getPaymentResult);

// Nhận IPN (webhook) từ MoMo - để test trên Postman
router.post('/ipn', paymentController.handlePaymentIPN);


module.exports = router;