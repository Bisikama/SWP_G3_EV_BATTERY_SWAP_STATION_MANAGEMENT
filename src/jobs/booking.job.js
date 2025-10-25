const { Booking } = require('../models');
const { Op } = require('sequelize');

/**
 * ========================================
 * CRON JOB: AUTO-CANCEL EXPIRED BOOKINGS
 * ========================================
 * Tự động hủy các booking đã quá scheduled_time mà vẫn còn pending
 * 
 * Chạy: Mỗi 5 phút
 * Logic: Nếu booking.status = 'pending' && now > scheduled_time → status = 'cancelled'
 */
async function cancelExpiredBookings() {
  try {
    const now = new Date();
    
    console.log('\n🔄 ========== CRON JOB: Cancel Expired Bookings ==========');
    console.log(`⏰ Running at: ${now.toLocaleString('vi-VN')}`);
    console.log(`📅 Checking bookings with scheduled_time < ${now.toISOString()}`);
    
    // Tìm tất cả booking có:
    // - status = 'pending'
    // - scheduled_time < now (đã quá hạn)
    const [updatedCount] = await Booking.update(
      { 
        status: 'cancelled'
      },
      {
        where: {
          status: 'pending',
          scheduled_time: {
            [Op.lt]: now // scheduled_time < now
          }
        }
      }
    );
    
    if (updatedCount > 0) {
      console.log(`✅ Successfully cancelled ${updatedCount} expired booking(s)`);
      
      // Log chi tiết các booking đã bị cancel
      const cancelledBookings = await Booking.findAll({
        where: {
          status: 'cancelled',
          scheduled_time: {
            [Op.lt]: now,
            [Op.gte]: new Date(now - 5 * 60000) // Trong vòng 5 phút vừa rồi
          }
        },
        attributes: ['booking_id', 'driver_id', 'vehicle_id', 'station_id', 'scheduled_time'],
        limit: 10
      });
      
      cancelledBookings.forEach(booking => {
        console.log(`   📦 Booking ID: ${booking.booking_id}`);
        console.log(`      Driver: ${booking.driver_id}`);
        console.log(`      Vehicle: ${booking.vehicle_id}`);
        console.log(`      Scheduled Time: ${booking.scheduled_time.toLocaleString('vi-VN')}`);
      });
    } else {
      console.log(`ℹ️  No expired bookings found`);
    }
    
    console.log('========== CRON JOB COMPLETED ==========\n');
    
    return {
      success: true,
      cancelledCount: updatedCount,
      timestamp: now
    };
    
  } catch (error) {
    console.error('❌ ERROR in cancelExpiredBookings cron job:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
}

module.exports = {
  cancelExpiredBookings
};
