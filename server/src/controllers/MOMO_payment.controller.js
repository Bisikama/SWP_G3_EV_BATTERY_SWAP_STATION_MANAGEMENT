const crypto = require('crypto');
const https = require('https');
const db = require('../models');
const { Invoice, PaymentRecord, Subscription } = db;
require('dotenv').config();

async function createPayment (req, res)  {
  // ✅ Nhận invoice_id từ request
  const { invoice_id } = req.body;
  
  // ✅ Validate invoice_id
  if (!invoice_id) {
    return res.status(400).json({
      message: 'invoice_id is required'
    });
  }
  
  try {
    // ✅ Query invoice từ database để lấy amount
    const invoice = await Invoice.findByPk(invoice_id);
    
    if (!invoice) {
      return res.status(404).json({
        message: 'Invoice not found'
      });
    }
    
    // ✅ Kiểm tra invoice đã paid chưa
    if (invoice.payment_status === 'paid') {
      console.log(`⚠️ Invoice ${invoice.invoice_number} is already paid`);
      return res.status(400).json({
        success: false,
        message: 'This invoice has already been paid',
        invoice: {
          invoice_number: invoice.invoice_number,
          payment_status: invoice.payment_status,
          pay_date: invoice.pay_date
        }
      });
    }
    
    // ✅ Lấy amount từ invoice
    const amount = parseInt(invoice.total_fee.toString());
    
    // ✅ Tạo orderId UNIQUE bằng cách thêm timestamp
    // Format: INV_<invoice_id>_<timestamp>
    const partnerCode = 'MOMO';
    const timestamp = new Date().getTime();
    const orderId = `INV_${invoice_id}_${timestamp}`;
    
    console.log(`🆔 Generated unique OrderID: ${orderId}`);
    
    // Phần còn lại giữ nguyên
    var accessKey = process.env.MOMO_ACCESS_KEY;
    var secretKey = process.env.MOMO_SECRET_KEY;
    var orderInfo = `Payment for Invoice #${invoice_id}`;
    var redirectUrl = process.env.MOMO_REDIRECT_URL;
    var ipnUrl = process.env.MOMO_IPN_URL;
    var requestType = "payWithMethod";
    var requestId = orderId;
    var extraData = JSON.stringify({ invoice_id: invoice_id }); // ✅ Lưu invoice_id vào extraData
    var paymentCode = 'T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==';
    var orderGroupId = '';
    var autoCapture = true;
    var lang = 'vi';

    //before sign HMAC SHA256 with format
    var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
    
    console.log("--------------------RAW SIGNATURE----------------")
    console.log(rawSignature)
    
    //signature
    const crypto = require('crypto');
    var signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');
    console.log("--------------------SIGNATURE----------------")
    console.log(signature)

    //json object send to MoMo endpoint
    const requestBody = JSON.stringify({
        partnerCode : partnerCode,
        partnerName : "Test",
        storeId : "MomoTestStore",
        requestId : requestId,
        amount : amount,
        orderId : orderId,
        orderInfo : orderInfo,
        redirectUrl : redirectUrl,
        ipnUrl : ipnUrl,
        lang : lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData : extraData,
        orderGroupId: orderGroupId,
        signature : signature
    });
    
    //Create the HTTPS objects
    const https = require('https');
    const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    }
    
    //Send the request and get the response
    const req2 = https.request(options, res2 => {
        console.log(`Status: ${res2.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res2.headers)}`);
        res2.setEncoding('utf8');
        res2.on('data', (body) => {
          const resonse = JSON.parse(body);
          res.status(201).json({
            message: 'Payment created successfully',
            data : resonse,
          });
        });
        res2.on('end', () => {
            console.log('No more data in response.');
        });
    })

    req2.on('error', (e) => {
        console.log(`problem with request: ${e.message}`);
    });
    
    // write data to request body
    console.log("Sending....")
    req2.write(requestBody);
    req2.end();
    
  } catch (error) {
    console.error('❌ Error creating payment:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

// ⚠️ HÀM NÀY CHỈ ĐỂ HIỂN THỊ KẾT QUẢ CHO USER
// Cập nhật database chỉ thực hiện trong `handlePaymentIPN` (IPN từ MoMo via ngrok/prod)
async function getPaymentResult (req, res)  {
  const { resultCode, orderId } = req.query;
  console.log('📱 User redirect from MoMo:', req.query);

  // Không thực hiện simulation IPN nữa — khi dùng ngrok hoặc production, MoMo sẽ gọi
  // trực tiếp vào endpoint /api/payment/ipn và `handlePaymentIPN` sẽ xử lý lưu DB.

  // Trả response cho user dựa trên query params
  if (resultCode === '0' || resultCode === 0) {
    res.status(200).json({ 
      message: 'Payment successful', 
      orderId,
      data: req.query 
    });
  } else {
    res.status(400).json({ 
      message: 'Payment failed', 
      orderId,
      data: req.query 
    });
  }
}

// ✅ HÀM NÀY LUÔN NHẬN ĐƯỢC REQUEST TỪ MOMO
// CẬP NHẬT DATABASE Ở ĐÂY vì MoMo đảm bảo gửi IPN về server
async function handlePaymentIPN (req, res)  {
  const { 
    resultCode, 
    orderId,        // Format: INV_<invoice_id>_<timestamp>
    amount, 
    transId,        // = payment_record_id (transaction_num)
    message,
    payType,        // = payment_type
    signature 
  } = req.body;
  
  console.log('\n🔔 ========== IPN Received from MoMo ==========');
  console.log('📥 Full Request Body:', JSON.stringify(req.body, null, 2));
  console.log('📋 Parsed Data:');
  console.log('   - resultCode:', resultCode, `(type: ${typeof resultCode})`);
  console.log('   - orderId:', orderId);
  console.log('   - amount:', amount);
  console.log('   - transId:', transId);
  console.log('   - message:', message);
  console.log('   - payType:', payType);
  console.log('   - signature:', signature ? 'Present' : 'Missing');
  
  try {
    // ✅ Parse orderId để lấy invoice_id
    // Format: INV_<invoice_id>_<timestamp>
    
    let invoice_id;
    if (orderId.startsWith('INV_')) {
      // Tách: "INV_uuid_timestamp" → ["INV", "uuid", "timestamp"]
      const parts = orderId.split('_');
      if (parts.length === 3) {
        invoice_id = parts[1];  // Lấy phần uuid
        console.log(`✅ Extracted invoice_id: ${invoice_id}`);
      } else {
        console.error(`❌ Invalid orderId format: ${orderId}`);
        return res.status(400).json({ 
          error: 'Invalid orderId format',
          orderId: orderId 
        });
      }
    } else {
      // Fallback: orderId chính là invoice_id (backward compatible)
      invoice_id = orderId;
      console.log(`⚠️ Using orderId as invoice_id (old format): ${invoice_id}`);
    }
    
    // Kiểm tra invoice có tồn tại không
    const invoice = await Invoice.findByPk(invoice_id);
    if (!invoice) {
      console.error(`❌ Invoice not found: ${invoice_id}`);
      return res.status(404).json({ 
        error: 'Invoice not found',
        invoice_id: invoice_id,
        orderId: orderId
      });
    }
    console.log(`✅ Invoice found: ${invoice_id} - Amount: ${invoice.total_fee}`);
    
    if (resultCode === 0) {
      // ✅ THANH TOÁN THÀNH CÔNG
      console.log('\n✅ ========== PAYMENT SUCCESSFUL ==========');
      const paymentData = {
        invoice_id: invoice_id,              // ← Dùng invoice_id đã parse
        transaction_num: transId.toString(),
        payment_date: new Date(),
        payment_method: 'momo',
        amount: amount,
        status: 'success',
        message: message || 'Payment successful',
        payment_type: payType || 'qr',
        signature: signature || ''
      };
      const paymentRecord = await PaymentRecord.create(paymentData);
      
      console.log(`✅ Payment record created successfully!`);
      console.log(`   - payment_id: ${paymentRecord.payment_id}`);
      console.log(`   - invoice_id: ${paymentRecord.invoice_id}`);
      console.log(`   - transaction_num: ${paymentRecord.transaction_num}`);
      console.log(`   - status: ${paymentRecord.status}`);
      
      // Verify record was saved
      const verifyRecord = await PaymentRecord.findByPk(paymentRecord.payment_id);
      if (verifyRecord) {
        console.log(`✅ Verification SUCCESS - Record exists in database!`);
        console.log(`   - Verified payment_id: ${verifyRecord.payment_id}`);
      } else {
        console.error(`❌ Verification FAILED - Record NOT found in database!`);
      }
      
      // Cập nhật invoice: payment_status, pay_date, due_date
      const pay_date = new Date();
      const due_date = new Date(pay_date);
      due_date.setMonth(due_date.getMonth() + 1); // due_date = pay_date + 1 tháng
      
      const [updatedRows] = await Invoice.update({ 
        payment_status: 'paid',
        pay_date: pay_date,
        due_date: due_date
      }, { 
        where: { invoice_id: invoice_id }    // ← Dùng invoice_id đã parse
      });
      
      console.log(`✅ Invoice updated: ${updatedRows} row(s) affected`);
      console.log(`   - payment_status: paid`);
      console.log(`   - pay_date: ${pay_date.toISOString().split('T')[0]}`);
      console.log(`   - due_date: ${due_date.toISOString().split('T')[0]}`);
      
      // Verify invoice update
      const updatedInvoice = await Invoice.findByPk(invoice_id);
      console.log(`   - Verified payment_status: ${updatedInvoice.payment_status}`);
      console.log(`   - Verified pay_date: ${updatedInvoice.pay_date}`);
      console.log(`   - Verified due_date: ${updatedInvoice.due_date}`);
      
      console.log('\n✅ ========== IPN PROCESSING COMPLETE ==========\n');
      
      // MoMo yêu cầu trả về status 204 No Content
      res.status(204).send();
      
    } else {
      // ❌ THANH TOÁN THẤT BẠI
      console.log('\n❌ ========== PAYMENT FAILED ==========');
      console.log(`📝 Creating failed payment record with data:`);
      
      const paymentData = {
        invoice_id: invoice_id,              // ← Dùng invoice_id đã parse
        transaction_num: transId ? transId.toString() : `FAILED_${Date.now()}`,
        payment_date: new Date(),
        payment_method: 'momo',
        amount: amount,
        status: 'fail',
        message: message || 'Payment failed',
        payment_type: payType || 'unknown',
        signature: signature || ''
      };
      
      console.log(JSON.stringify(paymentData, null, 2));
      
      console.log('\n💾 Step 3: Creating failed payment record...');
      const paymentRecord = await PaymentRecord.create(paymentData);
      
      console.log(`✅ Failed payment record created!`);
      console.log(`   - payment_id: ${paymentRecord.payment_id}`);
      console.log(`   - status: ${paymentRecord.status}`);
      console.log(`   - message: ${paymentRecord.message}`);
      
      // Verify record was saved
      console.log('\n🔍 Step 4: Verifying failed payment record...');
      const verifyRecord = await PaymentRecord.findByPk(paymentRecord.payment_id);
      if (verifyRecord) {
        console.log(`✅ Verification SUCCESS - Failed record exists in database!`);
      } else {
        console.error(`❌ Verification FAILED - Record NOT found!`);
      }
      
      console.log('\n❌ ========== FAILED IPN PROCESSING COMPLETE ==========\n');
      
      res.status(204).send();
    }
  } catch (error) {
    console.error('\n❌ ========== ERROR PROCESSING IPN ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      })));
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('Foreign key constraint error - Invoice may not exist');
    }
    
    console.error('===============================================\n');
    
    // Trả 500 để MoMo retry
    res.status(500).send();
  }
}



module.exports = { createPayment, getPaymentResult, handlePaymentIPN};