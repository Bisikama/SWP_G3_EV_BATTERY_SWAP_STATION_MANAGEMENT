const cron = require('node-cron');
const { deactivateExpiredSubscriptions, sendExpiryReminders } = require('../jobs/subscription.job');
const { cancelExpiredBookings } = require('../jobs/booking.job');
const { autoCharge } = require('../jobs/charging.job');

/**
 * Khởi động tất cả cron jobs
 */
function startCronJobs() {
  console.log('\n🚀 ========== INITIALIZING CRON JOBS ==========');
  
  // ✅ Cron Job 1: Tự động deactivate subscription hết hạn
  // Schedule: Chạy mỗi ngày lúc 00:01 sáng
  // Cron format: "phút giờ ngày tháng thứ"
  //              "1    0   *   *    *"  = 12:05 mỗi ngày
  const subscriptionJob = cron.schedule('8 12 * * *', () => {
    deactivateExpiredSubscriptions();
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh" // Múi giờ Việt Nam
  });
  
  console.log('✅ Cron Job Started: Deactivate Expired Subscriptions');
  console.log('   ⏰ Schedule: Every day at 00:01 AM (Asia/Ho_Chi_Minh timezone)');
  console.log('   📝 Description: Auto-deactivate subscriptions with end_date < today');
  
  // ✅ Cron Job 2: Tự động cancel booking quá hạn
  // Schedule: Chạy mỗi 10 phút
  // Cron format: "*/10 * * * *" = Mỗi 10 phút
  const bookingJob = cron.schedule('*/10 * * * *', () => {
    cancelExpiredBookings();
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });
  
  console.log('✅ Cron Job Started: Cancel Expired Bookings');
  console.log('   ⏰ Schedule: Every 10 minutes');
  console.log('   📝 Description: Auto-cancel bookings with expired_time < now and status = pending');
  
  // ✅ Cron Job 3: Gửi email nhắc nhở gia hạn gói
  // Schedule: Chạy mỗi sáng lúc 08:00
  // Cron format: "0 8 * * *" = 08:00 mỗi ngày
  const expiryReminderJob = cron.schedule('0 8 * * *', () => {
    sendExpiryReminders();
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });
  
  console.log('✅ Cron Job Started: Send Subscription Expiry Reminders');
  console.log('   ⏰ Schedule: Every day at 08:00 AM (Asia/Ho_Chi_Minh timezone)');
  console.log('   📝 Description: Send email reminders to drivers with expired subscriptions (end_date = today)');

  const chargingJob = cron.schedule('*/15 * * * *', () => {
    const durationMinutes = 15;
    autoCharge(durationMinutes);
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
  });

  console.log('✅ Cron Job Started: Simulate Battery Charging');
  console.log('   ⏰ Schedule: Every 15 minutes');
  console.log('   📝 Description: Auto-charge batteries inside cabinets at all stations');

  // ℹ️ Có thể thêm các cron jobs khác ở đây
  // Ví dụ:
  // const invoiceReminderJob = cron.schedule('0 9 * * *', () => {
  //   sendInvoiceReminders();
  // });
  
  console.log('✅ ========== ALL CRON JOBS INITIALIZED ==========\n');
  
  return {
    subscriptionJob,
    bookingJob,
    expiryReminderJob,
    chargingJob,
    // invoiceReminderJob, // Thêm jobs khác ở đây
  };
}

/**
 * Dừng tất cả cron jobs (dùng khi shutdown server)
 */
function stopCronJobs(jobs) {
  console.log('\n🛑 Stopping all cron jobs...');
  Object.values(jobs).forEach(job => {
    if (job && typeof job.stop === 'function') {
      job.stop();
    }
  });
  console.log('✅ All cron jobs stopped\n');
}

module.exports = {
  startCronJobs,
  stopCronJobs
};
