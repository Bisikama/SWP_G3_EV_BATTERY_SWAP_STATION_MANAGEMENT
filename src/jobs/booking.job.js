const { Booking, BookingBattery, Battery, CabinetSlot } = require('../models');
const { Op } = require('sequelize');

/**
 * Cron Job: Tự động cancel các booking đã quá hạn
 * File: src/jobs/booking.job.js
 * 
 * Chức năng:
 * Job này tìm tất cả bookings có status pending nhưng đã quá expired_time.
 * Với mỗi booking expired, job sẽ:
 * 1. Update booking status thành cancelled
 * 2. Release các cabinet slots đã reserve về trạng thái available
 * 
 * Cabinet slot status logic sau khi release:
 * - Nếu battery SOH >= 70%: slot chuyển về occupied (available cho booking mới)
 * - Nếu battery SOH < 70%: slot chuyển về locked (unavailable, cần maintenance)
 * 
 * Lưu ý:
 * Job chỉ modify Booking.status và CabinetSlot.status.
 * Battery records và BookingBattery associations không thay đổi.
 * 
 * Schedule: Chạy mỗi 1 phút (cron: * * * * *)
 */
async function cancelExpiredBookings() {
  try {
    const now = new Date();
    
    console.log('\n[CRON JOB] Cancel Expired Bookings - START');
    console.log('[CRON JOB] Running at:', now.toLocaleString('vi-VN'));
    console.log('[CRON JOB] Checking bookings with expired_time <', now.toISOString());
    
    // Query tất cả bookings có status pending nhưng đã quá hạn
    const expiredBookings = await Booking.findAll({
      where: {
        status: 'pending',
        expired_time: {
          [Op.lt]: now
        }
      }
    });
    
    // Không có booking nào expired thì return luôn
    if (expiredBookings.length === 0) {
      console.log('[CRON JOB] No expired bookings found');
      console.log('[CRON JOB] Cancel Expired Bookings - COMPLETED\n');
      
      return {
        success: true,
        cancelledCount: 0,
        timestamp: now
      };
    }

    console.log('[CRON JOB] Found', expiredBookings.length, 'expired booking(s) to cancel');

    // Xử lý từng booking expired
    let successCount = 0;
    
    for (const booking of expiredBookings) {
      try {
        // Bước 1: Đánh dấu booking là cancelled
        await booking.update({ status: 'cancelled' });

        // Bước 2: Lấy tất cả batteries liên quan với booking này
        // Chỉ lấy batteries đang ở trong cabinet slots (slot_id not null)
        const bookingBatteries = await BookingBattery.findAll({
          where: { 
            booking_id: booking.booking_id 
          },
          include: [{
            model: Battery,
            as: 'battery',
            attributes: ['battery_id', 'slot_id', 'current_soc', 'current_soh'],
            where: {
              slot_id: { [Op.not]: null }
            }
          }]
        });

        // Bước 3: Update cabinet slot status cho mỗi battery
        // Status phụ thuộc vào battery health (SOH)
        for (const bb of bookingBatteries) {
          const battery = bb.battery;
          
          if (battery && battery.slot_id) {
            const newStatus = battery.current_soh >= 70 ? 'occupied' : 'locked';
            
            await CabinetSlot.update(
              { status: newStatus },
              { where: { slot_id: battery.slot_id } }
            );
          }
        }

        // Log chi tiết booking đã cancel thành công
        console.log('[CRON JOB] Successfully cancelled booking:', booking.booking_id);
        console.log('[CRON JOB]   - Driver ID:', booking.driver_id);
        console.log('[CRON JOB]   - Vehicle ID:', booking.vehicle_id);
        console.log('[CRON JOB]   - Expired Time:', booking.expired_time.toLocaleString('vi-VN'));
        console.log('[CRON JOB]   - Released Slots:', bookingBatteries.length);

        successCount++;
        
      } catch (bookingError) {
        // Log lỗi của booking cá nhân nhưng vẫn tiếp tục xử lý các booking khác
        console.error('[CRON JOB] Failed to cancel booking:', booking.booking_id);
        console.error('[CRON JOB] Error:', bookingError.message);
      }
    }

    console.log('[CRON JOB] Successfully cancelled', successCount, 'booking(s)');
    console.log('[CRON JOB] Cancel Expired Bookings - COMPLETED\n');
    
    return {
      success: true,
      cancelledCount: successCount,
      timestamp: now
    };
    
  } catch (error) {
    // Log critical error nếu toàn bộ job bị lỗi
    console.error('[CRON JOB] CRITICAL ERROR in cancelExpiredBookings:', error.message);
    console.error('[CRON JOB] Stack trace:', error.stack);
    
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
