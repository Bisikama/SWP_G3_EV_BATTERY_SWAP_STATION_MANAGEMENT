const swapBatteryService = require('../services/swap_battery.service');
const db = require('../models');

/**
 * API 4.1: Lấy danh sách các ô pin đang trống
 * GET /api/swap/empty-slots
 * Query params:
 *   - station_id: ID của trạm (required)
 *   - cabinet_id: ID của tủ pin (optional)
 */
async function getEmptySlots(req, res) {
  try {
    const { station_id, cabinet_id } = req.query;

    if (!station_id) {
      return res.status(400).json({
        success: false,
        message: 'station_id là bắt buộc'
      });
    }

    console.log(`\n📍 Getting empty slots for station ${station_id}${cabinet_id ? `, cabinet ${cabinet_id}` : ''}`);

    const emptySlots = await swapBatteryService.getEmptySlots(
      parseInt(station_id),
      cabinet_id ? parseInt(cabinet_id) : null
    );

    console.log(`✅ Found ${emptySlots.length} empty slot(s)`);

    return res.status(200).json({
      success: true,
      message: `Tìm thấy ${emptySlots.length} ô pin trống`,
      data: {
        station_id: parseInt(station_id),
        cabinet_id: cabinet_id ? parseInt(cabinet_id) : null,
        empty_slots_count: emptySlots.length,
        empty_slots: emptySlots
      }
    });
  } catch (error) {
    console.error('❌ Error in getEmptySlots:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ô pin trống',
      error: error.message
    });
  }
}

/**
 * API 4.2: Xác nhận pin được đưa vào các slot
 * POST /api/swap/validate-insertion
 * Body:
 * {
 *   "slotUpdates": [
 *     { "slot_id": 1, "battery_id": "uuid" },
 *     { "slot_id": 2, "battery_id": "uuid" }
 *   ]
 * }
 */
async function validateBatteryInsertion(req, res) {
  try {
    const { slotUpdates } = req.body;

    if (!slotUpdates || !Array.isArray(slotUpdates) || slotUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'slotUpdates phải là một mảng không rỗng'
      });
    }

    console.log(`\n🔍 Validating ${slotUpdates.length} battery insertion(s)`);

    const validation = await swapBatteryService.validateBatteryInsertion(slotUpdates);

    if (validation.allValid) {
      console.log('✅ All battery insertions are valid');
      return res.status(200).json({
        success: true,
        message: 'Tất cả pin đều hợp lệ để đưa vào slot',
        data: validation
      });
    } else {
      console.log('⚠️ Some battery insertions are invalid');
      const invalidCount = validation.results.filter(r => !r.valid).length;
      return res.status(400).json({
        success: false,
        message: `${invalidCount}/${slotUpdates.length} pin không hợp lệ`,
        data: validation
      });
    }
  } catch (error) {
    console.error('❌ Error in validateBatteryInsertion:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực pin',
      error: error.message
    });
  }
}

/**
 * API 5: Thực hiện swap pin (transaction)
 * POST /api/swap/execute
 * Body:
 * {
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1,
 *   "batteriesIn": [
 *     { "slot_id": 1, "battery_id": "uuid-old-1" },
 *     { "slot_id": 2, "battery_id": "uuid-old-2" }
 *   ],
 *   "batteriesOut": [
 *     { "slot_id": 3, "battery_id": "uuid-new-1" },
 *     { "slot_id": 4, "battery_id": "uuid-new-2" }
 *   ]
 * }
 */
async function executeSwap(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      driver_id,
      vehicle_id,
      station_id,
      batteriesIn,   // Pin cũ đưa vào
      batteriesOut   // Pin mới lấy ra
    } = req.body;

    // Validation
    if (!driver_id || !vehicle_id || !station_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'driver_id, vehicle_id, station_id là bắt buộc'
      });
    }

    if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'batteriesIn phải là mảng không rỗng'
      });
    }

    if (!batteriesOut || !Array.isArray(batteriesOut) || batteriesOut.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'batteriesOut phải là mảng không rỗng'
      });
    }

    console.log(`\n🔄 ========== EXECUTING BATTERY SWAP ==========`);
    console.log(`Driver: ${driver_id}`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);
    console.log(`Batteries OUT: ${batteriesOut.length}`);

    const swapResults = [];

    // Bước 1: Xử lý pin cũ đưa vào (batteriesIn)
    console.log('\n📥 Step 1: Processing batteries IN (old batteries)...');
    for (const batteryIn of batteriesIn) {
      const { slot_id, battery_id } = batteryIn;

      // Lấy thông tin battery để check SOH
      const battery = await db.Battery.findByPk(battery_id, { transaction });
      if (!battery) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Battery ${battery_id} không tồn tại`
        });
      }

      const soh_in = battery.current_soh;

      // Xác định status của slot dựa vào SOH
      const newSlotStatus = soh_in < 15 ? 'faulty' : 'charging';

      console.log(`  📦 Battery ${battery_id} (SOH: ${soh_in}%) → Slot ${slot_id} (status: ${newSlotStatus})`);

      // Cập nhật slot status
      await swapBatteryService.updateSlotStatus(slot_id, newSlotStatus);

      // Cập nhật battery: gán vào slot, remove khỏi vehicle
      await swapBatteryService.updateOldBatteryToSlot(battery_id, slot_id);

      swapResults.push({
        type: 'IN',
        battery_id,
        slot_id,
        soh: soh_in,
        slot_status: newSlotStatus
      });
    }

    // Bước 2: Xử lý pin mới lấy ra (batteriesOut)
    console.log('\n📤 Step 2: Processing batteries OUT (new batteries)...');
    for (const batteryOut of batteriesOut) {
      const { slot_id, battery_id } = batteryOut;

      // Lấy thông tin battery
      const battery = await db.Battery.findByPk(battery_id, { transaction });
      if (!battery) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Battery ${battery_id} không tồn tại`
        });
      }

      const soh_out = battery.current_soh;

      console.log(`  📦 Battery ${battery_id} (SOH: ${soh_out}%) ← Slot ${slot_id}`);

      // Cập nhật slot thành empty
      await swapBatteryService.updateSlotStatus(slot_id, 'empty');

      // Cập nhật battery: gán cho vehicle, remove khỏi slot
      await swapBatteryService.updateNewBatteryToVehicle(battery_id, vehicle_id);

      swapResults.push({
        type: 'OUT',
        battery_id,
        slot_id,
        soh: soh_out,
        slot_status: 'empty'
      });
    }

    // Bước 3: Tạo swap records
    console.log('\n📝 Step 3: Creating swap records...');
    const swapRecords = [];

    // Tạo swap record cho từng cặp pin (1-1)
    const maxLength = Math.max(batteriesIn.length, batteriesOut.length);
    for (let i = 0; i < maxLength; i++) {
      const batteryIn = batteriesIn[i];
      const batteryOut = batteriesOut[i];

      const batteryInData = batteryIn ? await db.Battery.findByPk(batteryIn.battery_id, { transaction }) : null;
      const batteryOutData = batteryOut ? await db.Battery.findByPk(batteryOut.battery_id, { transaction }) : null;

      const swapRecord = await swapBatteryService.createSwapRecord({
        driver_id,
        vehicle_id,
        station_id,
        battery_id_in: batteryIn ? batteryIn.battery_id : null,
        battery_id_out: batteryOut ? batteryOut.battery_id : null,
        soh_in: batteryInData ? batteryInData.current_soh : null,
        soh_out: batteryOutData ? batteryOutData.current_soh : null
      });

      swapRecords.push(swapRecord);
      console.log(`  ✅ Swap record created: ${swapRecord.swap_id}`);
    }

    await transaction.commit();

    console.log('\n✅ ========== SWAP COMPLETED SUCCESSFULLY ==========\n');

    return res.status(200).json({
      success: true,
      message: 'Đổi pin thành công',
      data: {
        driver_id,
        vehicle_id,
        station_id,
        swap_summary: {
          batteries_in: batteriesIn.length,
          batteries_out: batteriesOut.length,
          swap_records: swapRecords.length
        },
        swap_results: swapResults,
        swap_records: swapRecords
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error in executeSwap:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện đổi pin',
      error: error.message
    });
  }
}

/**
 * API 5: Lấy danh sách pin sẵn sàng để đổi
 * GET /api/swap/available-batteries
 * Query params:
 *   - station_id: ID của trạm (required)
 *   - battery_type_id: ID của loại pin (required)
 *   - quantity: Số lượng pin cần (required)
 */
async function getAvailableBatteries(req, res) {
  try {
    const { station_id, battery_type_id, quantity } = req.query;

    if (!station_id || !battery_type_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'station_id, battery_type_id, quantity là bắt buộc'
      });
    }

    console.log(`\n🔋 Getting available batteries: station=${station_id}, type=${battery_type_id}, qty=${quantity}`);

    const availableSlots = await swapBatteryService.getAvailableBatteriesForSwap(
      parseInt(station_id),
      parseInt(battery_type_id),
      parseInt(quantity)
    );

    const hasEnough = availableSlots.length >= parseInt(quantity);

    console.log(`✅ Found ${availableSlots.length}/${quantity} available batteries`);

    return res.status(200).json({
      success: true,
      message: hasEnough
        ? `Đủ pin để đổi (${availableSlots.length}/${quantity})`
        : `Không đủ pin để đổi (${availableSlots.length}/${quantity})`,
      data: {
        station_id: parseInt(station_id),
        battery_type_id: parseInt(battery_type_id),
        requested_quantity: parseInt(quantity),
        available_quantity: availableSlots.length,
        has_enough: hasEnough,
        available_batteries: availableSlots.map(slot => ({
          slot_id: slot.slot_id,
          slot_number: slot.slot_number,
          battery_id: slot.battery.battery_id,
          battery_serial: slot.battery.battery_serial,
          current_soc: slot.battery.current_soc,
          current_soh: slot.battery.current_soh,
          cabinet: slot.cabinet
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error in getAvailableBatteries:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách pin sẵn sàng',
      error: error.message
    });
  }
}

module.exports = {
  getEmptySlots,
  validateBatteryInsertion,
  executeSwap,
  getAvailableBatteries
};
