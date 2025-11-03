const { Booking, BookingBattery, Battery, CabinetSlot } = require('../models');
const { Op } = require('sequelize');

/**
 * ========================================
 * CRON JOB: AUTO-CANCEL EXPIRED BOOKINGS
 * ========================================
 * Tự động hủy các booking đã quá expired_time mà vẫn còn pending
 * 
 * Chạy: Mỗi 5 phút
 * Logic: Nếu booking.status = 'pending' && now > expired_time → status = 'cancelled'
 */
async function cancelExpiredBookings() {
  try {
    const now = new Date();
    
    console.log('\n🔄 ========== CRON JOB: Cancel Expired Bookings ==========');
    console.log(`⏰ Running at: ${now.toLocaleString('vi-VN')}`);
    console.log(`📅 Checking bookings with expired_time < ${now.toISOString()}`);
    
    // Tìm tất cả booking có:
    // - status = 'pending'
    // - expired_time < now (đã quá hạn)
    const expiredBookings = await Booking.findAll({
      where: {
        status: 'pending',
        expired_time: {
          [Op.lt]: now // expired_time < now
        }
      }
    });
    
    if (expiredBookings.length === 0) {
      console.log(`ℹ️  No expired bookings found`);
      console.log('========== CRON JOB COMPLETED ==========\n');
      return {
        success: true,
        cancelledCount: 0,
        timestamp: now
      };
    }

    console.log(`📦 Found ${expiredBookings.length} expired booking(s) to cancel`);

    // Process each booking: cancel + unlock cabinet slots
    let successCount = 0;
    for (const booking of expiredBookings) {
      try {
        // 1. Update booking status to cancelled
        await booking.update({ status: 'cancelled' });

        // 2. Unlock cabinet slots: booked → occupied (if SOH > 70%) or locked (if SOH ≤ 70%)
        const bookingBatteries = await BookingBattery.findAll({
          where: { booking_id: booking.booking_id },
          include: [{
            model: Battery,
            as: 'battery',
            attributes: ['battery_id', 'slot_id', 'current_soc', 'current_soh'],
            where: {
              slot_id: { [Op.not]: null } // Only batteries in cabinet slots
            }
          }]
        });

        // Update cabinet slot status based on battery SOH
        for (const bb of bookingBatteries) {
          const battery = bb.battery;
          if (battery && battery.slot_id) {
            // Logic: SOH > 70% → 'occupied' (sẵn sàng), SOH ≤ 70% → 'locked' (không cho booking)
            const newStatus = battery.current_soh > 70 ? 'occupied' : 'locked';
            await CabinetSlot.update(
              { status: newStatus },
              { where: { slot_id: battery.slot_id } }
            );
          }
        }

        console.log(`   ✅ Booking ID: ${booking.booking_id}`);
        console.log(`      Driver: ${booking.driver_id}`);
        console.log(`      Vehicle: ${booking.vehicle_id}`);
        console.log(`      Expired Time: ${booking.expired_time.toLocaleString('vi-VN')}`);
        console.log(`      Unlocked ${bookingBatteries.length} cabinet slot(s)`);

        successCount++;
      } catch (bookingError) {
        console.error(`   ❌ Failed to cancel booking ${booking.booking_id}:`, bookingError.message);
      }
    }

    console.log(`✅ Successfully cancelled ${successCount} expired booking(s)`);
    console.log('========== CRON JOB COMPLETED ==========\n');
    
    return {
      success: true,
      cancelledCount: successCount,
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
