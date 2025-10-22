const swapBatteryService = require('../services/swap_battery.service');
const db = require('../models');

/**
 * API 4: Validate và tự động thực hiện swap nếu thỏa điều kiện
 * POST /api/swap/validate-and-prepare
 * Body:
 * {
 *   "driver_id": "uuid",      // ← THÊM MỚI
 *   "vehicle_id": "uuid",     // ← THÊM MỚI
 *   "station_id": 1,
 *   "battery_type_id": 1,
 *   "requested_quantity": 2,
 *   "batteriesIn": [
 *     { "slot_id": 1, "battery_id": "uuid-old-1" },
 *     { "slot_id": 2, "battery_id": "uuid-old-2" }
 *   ]
 * }
 */
async function validateAndPrepareSwap(req, res) {
  try {
    const { driver_id, vehicle_id, station_id, battery_type_id, requested_quantity, batteriesIn } = req.body;

    // Validation input
    if (!driver_id || !vehicle_id) {
      return res.status(400).json({
        success: false,
        message: 'driver_id và vehicle_id là bắt buộc'
      });
    }

    if (!station_id || !battery_type_id || !requested_quantity) {
      return res.status(400).json({
        success: false,
        message: 'station_id, battery_type_id, requested_quantity là bắt buộc'
      });
    }

    if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'batteriesIn phải là mảng không rỗng'
      });
    }

    // Kiểm tra số lượng pin đưa vào không vượt quá số lượng yêu cầu
    if (batteriesIn.length > requested_quantity) {
      return res.status(400).json({
        success: false,
        message: `Số lượng pin đưa vào (${batteriesIn.length}) vượt quá số lượng đã chọn đổi (${requested_quantity})`,
        data: {
          batteries_in_count: batteriesIn.length,
          requested_quantity: requested_quantity
        }
      });
    }

    console.log(`\n🔍 ========== VALIDATING SWAP PREPARATION ==========`);
    console.log(`Driver: ${driver_id}`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);
    console.log(`Battery Type: ${battery_type_id}`);
    console.log(`Requested Quantity: ${requested_quantity}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);

    // Bước 1: Lấy danh sách ô pin trống
    console.log('\n📍 Step 1: Getting empty slots...');
    const emptySlots = await swapBatteryService.getEmptySlots(parseInt(station_id));
    console.log(`✅ Found ${emptySlots.length} empty slot(s)`);

    // Bước 2: Validate pin đưa vào
    console.log('\n🔍 Step 2: Validating batteries IN...');
    const validation = await swapBatteryService.validateBatteryInsertion(batteriesIn);

    // Lọc ra các pin hợp lệ
    const validBatteries = validation.results.filter(r => r.valid);
    const invalidBatteries = validation.results.filter(r => !r.valid);

    console.log(`✅ Valid batteries: ${validBatteries.length}/${batteriesIn.length}`);
    if (invalidBatteries.length > 0) {
      console.log(`❌ Invalid batteries: ${invalidBatteries.length}`);
    }

    // Bước 3: Kiểm tra pin sẵn sàng để đổi
    console.log('\n🔋 Step 3: Checking available batteries for swap...');
    const availableSlots = await swapBatteryService.getAvailableBatteriesForSwap(
      parseInt(station_id),
      parseInt(battery_type_id),
      validBatteries.length
    );

    console.log(`✅ Available batteries (SOC >= 90%): ${availableSlots.length}/${validBatteries.length}`);

    // Kiểm tra các điều kiện
    const hasEnoughValidBatteries = validBatteries.length === requested_quantity;
    const hasEnoughAvailableBatteries = availableSlots.length >= validBatteries.length;
    const canProceed = validBatteries.length > 0 && hasEnoughAvailableBatteries;

    // Xác định message và status
    let responseStatus = 200;
    let responseMessage = '';
    let requireConfirmation = false;
    let autoExecute = false; // ← THÊM FLAG

    if (validBatteries.length === 0) {
      // Không có pin hợp lệ
      responseStatus = 400;
      responseMessage = 'Không có viên pin nào hợp lệ. Vui lòng kiểm tra lại các pin đưa vào.';
    } else if (!hasEnoughAvailableBatteries) {
      // Không đủ pin để đổi
      responseStatus = 400;
      responseMessage = `Không đủ pin sẵn sàng để đổi. Cần ${validBatteries.length} pin, chỉ có ${availableSlots.length} pin (SOC >= 90%)`;
    } else if (!hasEnoughValidBatteries) {
      // Có pin hợp lệ nhưng ít hơn số lượng yêu cầu → Cần xác nhận
      responseStatus = 200;
      requireConfirmation = true;
      responseMessage = `Chỉ có ${validBatteries.length}/${requested_quantity} viên pin hợp lệ. Bạn có muốn tiếp tục đổi ${validBatteries.length} pin?`;
    } else {
      // ✅ Tất cả đều hợp lệ → TỰ ĐỘNG EXECUTE
      responseStatus = 200;
      autoExecute = true;
      responseMessage = `Tất cả ${validBatteries.length} pin đều hợp lệ. Đang thực hiện đổi pin...`;
    }

    console.log(`\n📊 Validation Result: ${responseMessage}`);

    // ✅ NẾU VALIDATE THÀNH CÔNG HOÀN TOÀN → TỰ ĐỘNG GỌI EXECUTE
    if (autoExecute) {
      console.log(`\n🚀 Auto-executing swap...`);
      
      // Gọi hàm executeSwap nội bộ
      return await executeSwapInternal({
        driver_id,
        vehicle_id,
        station_id,
        battery_type_id,
        batteriesIn: validBatteries.map(v => ({
          slot_id: v.slot_id,
          battery_id: v.battery_id
        }))
      }, res);
    }

    // Nếu cần xác nhận hoặc có lỗi → Trả về kết quả validate
    console.log(`✅ ========== VALIDATION COMPLETE ==========\n`);

    return res.status(responseStatus).json({
      success: canProceed,
      message: responseMessage,
      require_confirmation: requireConfirmation,
      data: {
        station_id: parseInt(station_id),
        battery_type_id: parseInt(battery_type_id),
        requested_quantity: requested_quantity,
        validation_summary: {
          total_batteries_in: batteriesIn.length,
          valid_batteries: validBatteries.length,
          invalid_batteries: invalidBatteries.length,
          available_batteries_out: availableSlots.length,
          can_proceed: canProceed
        },
        valid_batteries_in: validBatteries.map(v => ({
          slot_id: v.slot_id,
          battery_id: v.battery_id,
          battery_soh: v.battery_soh,
          battery_soc: v.battery_soc,
          new_slot_status: v.new_slot_status
        })),
        invalid_batteries_in: invalidBatteries.map(v => ({
          slot_id: v.slot_id,
          battery_id: v.battery_id,
          error: v.error
        })),
        available_batteries_out: availableSlots.map(slot => ({
          slot_id: slot.slot_id,
          slot_number: slot.slot_number,
          battery_id: slot.battery.battery_id,
          battery_serial: slot.battery.battery_serial,
          current_soc: slot.battery.current_soc,
          current_soh: slot.battery.current_soh
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error in validateAndPrepareSwap:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi validate và chuẩn bị đổi pin',
      error: error.message
    });
  }
}

/**
 * Hàm nội bộ thực hiện swap (được gọi từ validate hoặc từ API riêng)
 */
async function executeSwapInternal(params, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      driver_id,
      vehicle_id,
      station_id,
      battery_type_id,
      batteriesIn
    } = params;

    console.log(`\n🔄 ========== EXECUTING BATTERY SWAP ==========`);
    console.log(`Driver: ${driver_id}`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);
    console.log(`Battery Type: ${battery_type_id}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);

    const swapResults = [];

    // Bước 1: Xử lý pin cũ đưa vào
    console.log('\n📥 Step 1: Processing batteries IN (old batteries)...');
    for (const batteryIn of batteriesIn) {
      const { slot_id, battery_id } = batteryIn;

      const battery = await db.Battery.findByPk(battery_id, { transaction });
      if (!battery) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Battery ${battery_id} không tồn tại`
        });
      }

      const soh_in = battery.current_soh;
      const newSlotStatus = soh_in < 15 ? 'faulty' : 'charging';

      console.log(`  📦 Battery ${battery_id} (SOH: ${soh_in}%) → Slot ${slot_id} (status: ${newSlotStatus})`);

      await swapBatteryService.updateSlotStatus(slot_id, newSlotStatus);
      await swapBatteryService.updateOldBatteryToSlot(battery_id, slot_id);

      swapResults.push({
        type: 'IN',
        battery_id,
        slot_id,
        soh: soh_in,
        slot_status: newSlotStatus
      });
    }

    // Bước 2: Tự động lấy pin mới từ DB
    console.log('\n📤 Step 2: Finding available batteries to swap OUT...');
    
    const requiredQuantity = batteriesIn.length;
    const availableSlots = await swapBatteryService.getAvailableBatteriesForSwap(
      parseInt(station_id),
      parseInt(battery_type_id),
      requiredQuantity
    );

    if (availableSlots.length < requiredQuantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Không đủ pin để đổi. Cần ${requiredQuantity} pin, chỉ có ${availableSlots.length} pin sẵn sàng (SOC >= 90%)`,
        data: {
          required: requiredQuantity,
          available: availableSlots.length
        }
      });
    }

    console.log(`✅ Found ${availableSlots.length} available batteries (SOC >= 90%)`);

    // Bước 3: Xử lý pin mới lấy ra
    console.log('\n📤 Step 3: Processing batteries OUT (new batteries from DB)...');
    const batteriesOut = [];
    
    for (const slot of availableSlots) {
      const battery_id = slot.battery.battery_id;
      const slot_id = slot.slot_id;
      const soh_out = slot.battery.current_soh;
      const soc_out = slot.battery.current_soc;

      console.log(`  📦 Battery ${battery_id} (SOC: ${soc_out}%, SOH: ${soh_out}%) ← Slot ${slot_id}`);

      await swapBatteryService.updateSlotStatus(slot_id, 'empty');
      await swapBatteryService.updateNewBatteryToVehicle(battery_id, vehicle_id);

      batteriesOut.push({
        slot_id,
        battery_id,
        soc: soc_out,
        soh: soh_out
      });

      swapResults.push({
        type: 'OUT',
        battery_id,
        slot_id,
        soc: soc_out,
        soh: soh_out,
        slot_status: 'empty'
      });
    }

    // Bước 4: Tạo swap records
    console.log('\n📝 Step 4: Creating swap records...');
    const swapRecords = [];

    for (let i = 0; i < batteriesIn.length; i++) {
      const batteryIn = batteriesIn[i];
      const batteryOut = batteriesOut[i];

      const batteryInData = await db.Battery.findByPk(batteryIn.battery_id, { transaction });
      const batteryOutData = await db.Battery.findByPk(batteryOut.battery_id, { transaction });

      const swapRecord = await swapBatteryService.createSwapRecord({
        driver_id,
        vehicle_id,
        station_id,
        battery_id_in: batteryIn.battery_id,
        battery_id_out: batteryOut.battery_id,
        soh_in: batteryInData.current_soh,
        soh_out: batteryOutData.current_soh
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
        battery_type_id,
        swap_summary: {
          batteries_in: batteriesIn.length,
          batteries_out: batteriesOut.length,
          swap_records: swapRecords.length
        },
        batteries_out_info: batteriesOut,
        swap_results: swapResults,
        swap_records: swapRecords
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error in executeSwapInternal:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện đổi pin',
      error: error.message
    });
  }
}

/**
 * API 5: Execute swap thủ công (dùng khi cần confirmation)
 * POST /api/swap/execute
 */
async function executeSwap(req, res) {
  return await executeSwapInternal(req.body, res);
}

/**
 * API: Lấy danh sách pin sẵn sàng để đổi
 * GET /api/swap/available-batteries
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
  validateAndPrepareSwap,
  executeSwap,
  getAvailableBatteries
};