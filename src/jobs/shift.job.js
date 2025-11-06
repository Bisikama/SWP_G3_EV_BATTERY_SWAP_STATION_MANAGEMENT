const { Op } = require('sequelize');
const db = require('../models');
const shiftService = require('../services/shift.service');

async function autoAssignShiftDaily() {
  try {
    console.log('\n🔄 ========== AUTO ASSIGN SHIFT DAILY ==========');
    console.log(`⏰ Running at: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`📅 Assigning shift for the next day based on today's shift`);

    const today = new Date();
    today.setHours(0,0,0,0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todaysShifts = await db.Shift.findAll({
      where: {
        start_time: {
          [Op.gte]: today,
          [Op.lt]: new Date(today.getTime() + 24*60*60*1000)
        }
      }
    });

    if (!todaysShifts.length) {
      console.log('⚠️ Không tìm thấy ca hôm nay, bỏ qua tạo ca ngày mai.');
      return;
    }

    // Chuẩn bị ca ngày mai
    const newShifts = [];
    for (const shift of todaysShifts) {
      const newStart = new Date(shift.start_time);
      const newEnd = new Date(shift.end_time);
      newStart.setDate(newStart.getDate() + 1);
      newEnd.setDate(newEnd.getDate() + 1);

      const exists = await shiftService.findConflictedShift({
        staff_id: shift.staff_id,
        station_id: shift.station_id,
      }, newStart, newEnd);

      if (!exists) {
        newShifts.push({
          admin_id: shift.admin_id,
          staff_id: shift.staff_id,
          station_id: shift.station_id,
          start_time: newStart,
          end_time: newEnd
        });
      }
    }

    if (newShifts.length > 0) {
      await db.Shift.bulkCreate(newShifts);
      console.log(`✅ Tạo thành công ${newShifts.length} ca cho ngày mai (${tomorrow.toLocaleDateString()})`);
    } else {
      console.log('⚠️ Không có ca mới nào cần tạo cho ngày mai.');
    }

  } catch (error) {
    console.error('❌ ERROR - autoAssignShiftDaily:', error);
  }
}

module.exports = { autoAssignShiftDaily };
