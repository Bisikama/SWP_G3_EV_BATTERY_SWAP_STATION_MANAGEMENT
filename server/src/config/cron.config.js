const cron = require('node-cron');
const { deactivateExpiredSubscriptions } = require('../jobs/subscription.job');

/**
 * Khởi động tất cả cron jobs
 */
function startCronJobs() {
  console.log('\n🚀 ========== INITIALIZING CRON JOBS ==========');
  
  // ✅ Cron Job 1: Tự động deactivate subscription hết hạn
  // Schedule: Chạy mỗi ngày lúc 00:01 sáng
  // Cron format: "phút giờ ngày tháng thứ"
  //              "1    0   *   *    *"  = 00:01 mỗi ngày
  const subscriptionJob = cron.schedule('1 0 * * *', () => {
    deactivateExpiredSubscriptions();
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh" // Múi giờ Việt Nam
  });
  
  console.log('✅ Cron Job Started: Deactivate Expired Subscriptions');
  console.log('   ⏰ Schedule: Every day at 00:01 AM (Asia/Ho_Chi_Minh timezone)');
  console.log('   📝 Description: Auto-deactivate subscriptions with end_date < today');
  
  // ℹ️ Có thể thêm các cron jobs khác ở đây
  // Ví dụ:
  // const invoiceReminderJob = cron.schedule('0 9 * * *', () => {
  //   sendInvoiceReminders();
  // });
  
  console.log('✅ ========== ALL CRON JOBS INITIALIZED ==========\n');
  
  return {
    subscriptionJob
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
