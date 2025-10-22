const { Subscription } = require('../models');
const { Op } = require('sequelize');

/**
 * Cron Job: Tự động cập nhật sub_status = 'inactive' cho các subscription đã hết hạn
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
    // - sub_status = 'active'
    // - end_date < today (đã hết hạn)
    const [updatedCount] = await Subscription.update(
      { 
        sub_status: 'inactive',
        cancel_time: new Date() // Ghi nhận thời gian tự động hủy
      },
      {
        where: {
          sub_status: 'active',
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
          sub_status: 'inactive',
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

module.exports = {
  deactivateExpiredSubscriptions
};
