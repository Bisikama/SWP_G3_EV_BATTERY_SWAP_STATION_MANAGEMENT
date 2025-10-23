const crypto = require('crypto');
const https = require('https');
const db = require('../models');
const { create } = require('domain');
const { Invoice, PaymentRecord, Subscription } = db;
require('dotenv').config();

async function createPayment (req, res)  {
  // ✅ Nhận invoice_id, plan_id, vehicle_id từ request
  const { invoice_id, plan_id, vehicle_id } = req.body;
  
  // ✅ Validate input
  if (!invoice_id) {
    return res.status(400).json({
      message: 'invoice_id is required'
    });
  }

  if (!plan_id || !vehicle_id) {
    return res.status(400).json({
      message: 'plan_id and vehicle_id are required'
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
    total_fee  = invoice.plan_fee + invoice.total_swap_fee + invoice.total_penalty_fee;
    console.log(`💰 Creating payment for Invoice ${invoice.invoice_number} - Amount: ${total_fee}`);
    const amount = parseInt(total_fee.toString());
    
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
    // ✅ Thêm plan_id và vehicle_id vào extraData
    var extraData = JSON.stringify({ 
      invoice_id: invoice_id,
      plan_id: plan_id,
      vehicle_id: vehicle_id
    });
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
    extraData,      // ← Chứa invoice_id, plan_id, vehicle_id
    signature 
  } = req.body;
  
  try {
    // ✅ Parse extraData để lấy invoice_id, plan_id, vehicle_id
    let invoice_id, plan_id, vehicle_id;
    
    if (extraData) {
      try {
        const parsedData = JSON.parse(extraData);
        invoice_id = parsedData.invoice_id;
        plan_id = parsedData.plan_id;
        vehicle_id = parsedData.vehicle_id;
        console.log(`✅ Parsed extraData: invoice_id=${invoice_id}, plan_id=${plan_id}, vehicle_id=${vehicle_id}`);
      } catch (e) {
        console.error(`❌ Failed to parse extraData: ${e.message}`);
      }
    }
    
    // Fallback: Parse từ orderId nếu không có extraData
    if (!invoice_id && orderId.startsWith('INV_')) {
      const parts = orderId.split('_');
      if (parts.length === 3) {
        invoice_id = parts[1];
        console.log(`✅ Extracted invoice_id from orderId: ${invoice_id}`);
      }
    }
    
    if (!invoice_id) {
      console.error(`❌ Cannot extract invoice_id from orderId: ${orderId}`);
      return res.status(400).json({ 
        error: 'Invalid orderId format',
        orderId: orderId 
      });
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
      
      // Bước 1: Tạo PaymentRecord
      const paymentData = {
        invoice_id: invoice_id,
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
      console.log(`✅ Payment record created: ${paymentRecord.payment_id}`);
      
      // Bước 2: Cập nhật Invoice
      const pay_date = new Date();
      const due_date = new Date(pay_date);
      due_date.setMonth(due_date.getMonth() + 1);
      
      await Invoice.update({ 
        payment_status: 'paid',
        create_date: pay_date,
        due_date: due_date
      }, { 
        where: { invoice_id: invoice_id }
      });
      console.log(`✅ Invoice updated to 'paid'`);
      
      // Bước 3: TẠO MỚI SUBSCRIPTION (chỉ khi thanh toán thành công)
      if (plan_id && vehicle_id) {
        console.log('\n📦 Creating new subscription...');
        
        const subscriptionData = {
          invoice_id: invoice_id,
          driver_id: invoice.driver_id,
          vehicle_id: vehicle_id,
          plan_id: plan_id,
          soh_usage: 0,
          start_date: pay_date,
          end_date: due_date,
          cancel_time: null,
          sub_status: 'active'  // ← Kích hoạt ngay
        };
        
        const newSubscription = await Subscription.create(subscriptionData);
        
        console.log(`✅ Subscription created successfully!`);
        console.log(`   - subscription_id: ${newSubscription.subscription_id}`);
        console.log(`   - invoice_id: ${newSubscription.invoice_id}`);
        console.log(`   - vehicle_id: ${newSubscription.vehicle_id}`);
        console.log(`   - plan_id: ${newSubscription.plan_id}`);
        console.log(`   - sub_status: ${newSubscription.sub_status}`);
        console.log(`   - start_date: ${newSubscription.start_date}`);
        console.log(`   - end_date: ${newSubscription.end_date}`);
      } else {
        console.warn(`⚠️ Missing plan_id or vehicle_id - cannot create subscription`);
        console.warn(`   - plan_id: ${plan_id}`);
        console.warn(`   - vehicle_id: ${vehicle_id}`);
      }
      
      console.log('\n✅ ========== IPN PROCESSING COMPLETE ==========\n');
      
      // MoMo yêu cầu trả về status 204 No Content
      res.status(204).send();
      
    } else {
      // ❌ THANH TOÁN THẤT BẠI
      console.log('\n❌ ========== PAYMENT FAILED ==========');
      
      // Chỉ tạo PaymentRecord, KHÔNG tạo Subscription
      const paymentData = {
        invoice_id: invoice_id,
        transaction_num: transId ? transId.toString() : `FAILED_${Date.now()}`,
        payment_date: new Date(),
        payment_method: 'momo',
        amount: amount,
        status: 'fail',
        message: message || 'Payment failed',
        payment_type: payType || 'unknown',
        signature: signature || ''
      };
      
      const paymentRecord = await PaymentRecord.create(paymentData);
      
      console.log(`✅ Failed payment record created: ${paymentRecord.payment_id}`);
      console.log(`   - status: ${paymentRecord.status}`);
      console.log(`   - message: ${paymentRecord.message}`);
      console.log(`⚠️ Invoice and Subscription remain unchanged (payment failed)`);
      
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
      console.error('Foreign key constraint error');
    }
    
    console.error('===============================================\n');
    
    // Trả 500 để MoMo retry
    res.status(500).send();
  }
}



module.exports = { createPayment, getPaymentResult, handlePaymentIPN};