const { Booking, BookingBattery, Battery, CabinetSlot } = require('../models');
const { Op } = require('sequelize');

/**
 * Cron Job: Auto-cancel expired bookings
 * 
 * This job finds all bookings that are still in 'pending' status but have passed
 * their expiration time. For each expired booking, it will:
 *   1. Update booking status to 'cancelled'
 *   2. Release the reserved cabinet slots back to available state
 * 
 * Slot status logic after release:
 *   - If battery SOH >= 70%: slot becomes 'occupied' (available for new bookings)
 *   - If battery SOH < 70%: slot becomes 'locked' (unavailable, needs maintenance)
 * 
 * Note: This job only modifies Booking.status and CabinetSlot.status.
 *       Battery records and BookingBattery associations remain unchanged.
 */
async function cancelExpiredBookings() {
  try {
    const now = new Date();
    
    console.log('\n[CRON JOB] Cancel Expired Bookings - START');
    console.log('[CRON JOB] Running at:', now.toLocaleString('vi-VN'));
    console.log('[CRON JOB] Checking bookings with expired_time <', now.toISOString());
    
    // Query all bookings that are still pending but already expired
    const expiredBookings = await Booking.findAll({
      where: {
        status: 'pending',
        expired_time: {
          [Op.lt]: now
        }
      }
    });
    
    // Early return if no expired bookings found
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

    // Process each expired booking
    let successCount = 0;
    
    for (const booking of expiredBookings) {
      try {
        // Step 1: Mark booking as cancelled
        await booking.update({ status: 'cancelled' });

        // Step 2: Get all batteries associated with this booking
        // Only select batteries that are currently in cabinet slots
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

        // Step 3: Update cabinet slot status for each battery
        // Status depends on battery health (SOH)
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

        // Log success details
        console.log('[CRON JOB] Successfully cancelled booking:', booking.booking_id);
        console.log('[CRON JOB]   - Driver ID:', booking.driver_id);
        console.log('[CRON JOB]   - Vehicle ID:', booking.vehicle_id);
        console.log('[CRON JOB]   - Expired Time:', booking.expired_time.toLocaleString('vi-VN'));
        console.log('[CRON JOB]   - Released Slots:', bookingBatteries.length);

        successCount++;
        
      } catch (bookingError) {
        // Log individual booking error but continue processing others
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
    // Log critical error
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
