const { Subscription } = require('../models');
const { Op, where } = require('sequelize');
const emailService = require('../utils/emailService');

/**
 * Cron Job: Tự động cập nhật status = 'inactive' cho các subscription đã hết hạn
 * Chạy mỗi ngày lúc 00:01 sáng
 */
async function deactivateExpiredSubscriptions() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset về 00:00:00 của ngày hôm nay
    
    console.log('\n🔄 ========== CRON JOB: Deactivate Expired Subscriptions ==========');
    console.log(`⏰ Running at: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`📅 Checking subscriptions with end_date < ${today.toISOString().split('T')[0]}`);
    
    // Tìm tất cả subscription có:
    // - status = 'active'
    // - end_date < today (đã hết hạn)
    const [updatedCount] = await Subscription.update(
      { 
        status: 'inactive',
        cancel_time: new Date() // Ghi nhận thời gian tự động hủy
      },
      {
        where: {
          status: 'active',
          end_date: {
            [Op.lt]: today // end_date < today
          }
        }
      }
    );
    
    if (updatedCount > 0) {
      console.log(`✅ Successfully deactivated ${updatedCount} expired subscription(s)`);
      
      // Log chi tiết các subscription đã bị deactivate
      const deactivatedSubs = await Subscription.findAll({
        where: {
          status: 'inactive',
          cancel_time: {
            [Op.gte]: new Date(Date.now() - 60000) // Trong vòng 1 phút vừa rồi
          }
        },
        attributes: ['subscription_id', 'driver_id', 'vehicle_id', 'plan_id', 'end_date', 'cancel_time']
      });
      
      deactivatedSubs.forEach(sub => {
        console.log(`   📦 Subscription ID: ${sub.subscription_id}`);
        console.log(`      - Driver: ${sub.driver_id}`);
        console.log(`      - Vehicle: ${sub.vehicle_id}`);
        console.log(`      - Plan: ${sub.plan_id}`);
        console.log(`      - End Date: ${sub.end_date}`);
        console.log(`      - Deactivated At: ${sub.cancel_time.toLocaleString('vi-VN')}`);
      });
    } else {
      console.log(`ℹ️ No expired subscriptions found to deactivate`);
    }
    
    console.log('✅ ========== CRON JOB COMPLETED ==========\n');
    
  } catch (error) {
    console.error('\n❌ ========== CRON JOB ERROR ==========');
    console.error('Error deactivating expired subscriptions:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================================\n');
  }
}

/**
 * Cron Job: Gửi email nhắc nhở gia hạn gói cho subscription hết hạn và status = 'inactive'
 * Chạy mỗi sáng lúc 08:00
 */
async function sendExpiryReminders() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset về 00:00:00 của ngày hôm nay
    
    console.log('\n📧 ========== CRON JOB: Send Subscription Expiry Reminders ==========');
    console.log(`⏰ Running at: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`📅 Checking subscriptions with end_date < ${today.toISOString().split('T')[0]} and status = 'inactive'`);
    
    // Tìm các subscription có status = 'inactive' (đã hết hạn nhưng chưa được nhắc nhở)
    const expiredSubscriptions = await Subscription.findAll({
      where: {
        
        end_date: {
          [Op.lt]: today // end_date < today (đã hết hạn)
        },
        status: 'inactive' // Status = 'inactive' (chưa nhắc nhở)
      },
      include: [
        {
          association: 'driver',
          where: {
            email: ['nguyenminhbao28032000@gmail.com',
              'hung1cr761@gmail.com'
            ] // Chỉ lấy những driver có email
          },
          attributes: ['account_id', 'email', 'fullname']
        },
        {
          association: 'plan',
          attributes: ['plan_id', 'plan_name', 'plan_fee']
        },
        {
          association: 'vehicle',
          attributes: ['vehicle_id', 'license_plate']
        }
      ]
    });
    
    if (expiredSubscriptions.length === 0) {
      console.log(`ℹ️ No expired subscriptions with status='inactive' found to send reminders`);
      console.log('✅ ========== CRON JOB COMPLETED ==========\n');
      return;
    }
    
    console.log(`📬 Found ${expiredSubscriptions.length} subscription(s) to send expiry reminder`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Gửi email cho từng subscription
    for (const subscription of expiredSubscriptions) {
      try {
        const driver = subscription.driver;
        const plan = subscription.plan;
        const vehicle = subscription.vehicle;
        
        if (!driver || !driver.email) {
          console.log(`⚠️ Skip subscription ${subscription.subscription_id}: Driver email not found`);
          failedCount++;
          continue;
        }
        
        console.log(`\n📤 Sending expiry reminder to ${driver.email}...`);
        console.log(`   - Driver: ${driver.fullname} (${driver.account_id})`);
        console.log(`   - Plan: ${plan.plan_name}`);
        console.log(`   - Vehicle: ${vehicle.license_plate}`);
        console.log(`   - End Date: ${subscription.end_date}`);
        
        // Gửi email (bạn cần implement sendSubscriptionExpiryReminder trong emailService)
        const emailSent = await sendSubscriptionExpiryEmail(
          driver.email,
          driver.fullname,
          plan.plan_name,
          vehicle.license_plate,
          subscription.end_date,
          plan.plan_fee
        );
        
        if (emailSent) {
          // Cập nhật status từ 'inactive' thành 'reminded'
          await subscription.update({ status: 'reminded' });
          sentCount++;
          console.log(`   ✅ Email sent successfully to ${driver.email}`);
          console.log(`   ✅ Status updated: inactive → reminded`);
        } else {
          failedCount++;
          console.log(`   ❌ Failed to send email to ${driver.email}`);
        }
        
      } catch (error) {
        failedCount++;
        console.error(`   ❌ Error sending email for subscription ${subscription.subscription_id}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Sent: ${sentCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📝 Total: ${expiredSubscriptions.length}`);
    console.log('✅ ========== CRON JOB COMPLETED ==========\n');
    
  } catch (error) {
    console.error('\n❌ ========== CRON JOB ERROR ==========');
    console.error('Error sending expiry reminders:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================================\n');
  }
}

/**
 * Helper function: Gửi email nhắc nhở gia hạn gói
 */
async function sendSubscriptionExpiryEmail(toEmail, driverName, planName, licensePlate, endDate, planPrice) {
  try {
    const subject = '⚠️ Gói đăng ký của bạn đã hết hạn - Gia hạn ngay!';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
          .warning-box { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 5px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Thông Báo Hết Hạn Gói</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${driverName}</strong>,</p>
            
            <p>Gói đăng ký của bạn đã <strong style="color: #dc3545;">hết hạn</strong>. Vui lòng gia hạn để tiếp tục sử dụng dịch vụ đổi pin.</p>
            
            <div class="info-box">
              <h3>📋 Thông Tin Gói Đã Hết Hạn</h3>
              <p><strong>Tên gói:</strong> ${planName}</p>
              <p><strong>Biển số xe:</strong> ${licensePlate}</p>
              <p><strong>Ngày hết hạn:</strong> ${new Date(endDate).toLocaleDateString('vi-VN')}</p>
              <p><strong>Giá gia hạn:</strong> ${planPrice?.toLocaleString('vi-VN')} VNĐ</p>
            </div>
            
            <div class="warning-box">
              <strong>⚠️ Lưu ý:</strong> Bạn sẽ không thể đổi pin khi gói đã hết hạn. Vui lòng gia hạn ngay để tiếp tục sử dụng dịch vụ.
            </div>
            
            <div style="text-align: center;">
              <a href="http://localhost:5173" class="button">
                🔄 Gia Hạn Ngay
              </a>
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
            
            <div class="footer">
              <p>Trân trọng,<br><strong>EV Battery Swap Station Team</strong></p>
              <p style="font-size: 12px; color: #999;">Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Sử dụng emailService để gửi
    const transporter = emailService.createTransporter ? emailService.createTransporter() : require('nodemailer').createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const mailOptions = {
      from: `"EV Battery Swap Station" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
    return true;
    
  } catch (error) {
    console.error('Error sending subscription expiry email:', error);
    return false;
  }
}

module.exports = {
  deactivateExpiredSubscriptions,
  sendExpiryReminders
};
