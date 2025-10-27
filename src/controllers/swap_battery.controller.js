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
    const { driver_id, vehicle_id, battery_type_id, station_id, requested_quantity, batteriesIn } = req.body;

    // Validation input
    if (!vehicle_id || !driver_id) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id, driver_id là bắt buộc'
      });
    }

    if (!station_id || !requested_quantity) {
      return res.status(400).json({
        success: false,
        message: 'station_id, requested_quantity là bắt buộc'
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


    // Bước 1: Validate pin đưa vào (kiểm tra cả vehicle ownership)
    console.log('\n🔍 Step 1: Validating batteries IN...');
    const validation = await swapBatteryService.validateBatteryInsertion(batteriesIn, vehicle_id);

    // Lọc ra các pin hợp lệ
    const validBatteries = validation.results.filter(r => r.valid);
    const invalidBatteries = validation.results.filter(r => !r.valid);

    console.log(`✅ Valid batteries: ${validBatteries.length}/${batteriesIn.length}`);
    if (invalidBatteries.length > 0) {
      console.log(`❌ Invalid batteries: ${invalidBatteries.length}`);
      invalidBatteries.forEach(b => {
        console.log(`   - Battery ${b.battery_id}: ${b.error}`);
      });
    }

    // Bước 2: Kiểm tra pin sẵn sàng để đổi
    console.log('\n🔋 Step 2: Checking available batteries for swap...');
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
    let readyToExecute = false; // ← FLAG để frontend biết có thể execute không

    if (validBatteries.length === 0) {
      // Không có pin hợp lệ
      responseStatus = 400;
      responseMessage = 'Không có viên pin nào hợp lệ. Vui lòng kiểm tra lại các pin đưa vào.';
    } else if (!hasEnoughAvailableBatteries) {
      // Không đủ pin để đổi
      responseStatus = 400;
      responseMessage = `Không đủ pin sẵn sàng để đổi.`;
    } else if (!hasEnoughValidBatteries) {
      // Có pin hợp lệ nhưng ít hơn số lượng yêu cầu → Cần xác nhận
      responseStatus = 200;
      responseMessage = `Chỉ có ${validBatteries.length}/${requested_quantity} viên pin hợp lệ. Yêu cầu chọn lại số lượng pin muốn đổi.`;
    } else {
      // ✅ Tất cả đều hợp lệ → READY TO EXECUTE
      responseStatus = 200;
      readyToExecute = true;
      responseMessage = `Tất cả ${validBatteries.length} pin đều hợp lệ. Sẵn sàng để đổi pin.`;
    }

    console.log(`\n📊 Validation Result: ${responseMessage}`);
    console.log(`✅ ========== VALIDATION COMPLETE ==========\n`);

    return res.status(responseStatus).json({
      success: canProceed,
      message: responseMessage,
      ready_to_execute: readyToExecute, // ← Frontend dùng flag này để biết có thể call execute không
      data: {
        driver_id,
        vehicle_id,
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
      vehicle_id,
      station_id,
      batteriesIn
    } = params;

    console.log(`\n🔄 ========== EXECUTING BATTERY SWAP ==========`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);

    const swapResults = [];

    // Bước 1: Kiểm tra tất cả pin trong batteriesIn có thuộc về vehicle_id không
    console.log('\n🔍 Step 1: Validating battery ownership...');
    for (const batteryIn of batteriesIn) {
      const battery = await db.Battery.findByPk(batteryIn.battery_id, {
        attributes: ['battery_id', 'vehicle_id', 'battery_serial'],
        transaction
      });

      if (!battery) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Pin ${batteryIn.battery_id} không tồn tại`
        });
      }

      if (battery.vehicle_id !== vehicle_id) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: `Pin ${battery.battery_serial} (${battery.battery_id}) không thuộc về xe này. Không được phép đổi pin của xe khác.`,
          data: {
            battery_id: battery.battery_id,
            battery_serial: battery.battery_serial,
            battery_vehicle_id: battery.vehicle_id,
            requested_vehicle_id: vehicle_id
          }
        });
      }

      console.log(`   ✅ Battery ${battery.battery_id} belongs to vehicle ${vehicle_id}`);
    }

    console.log(`✅ All batteries belong to vehicle ${vehicle_id}`);
    
    // Bước 4: Kiểm tra xe có swap record trước đó không (để xác định lần đầu đổi pin)
    console.log('\n📝 Step 4: Checking if this is first-time swap...');
    const existingSwapCount = await db.SwapRecord.count({
      where: {
        vehicle_id: vehicle_id
      },
      transaction
    });
    
    const isFirstTimeSwap = existingSwapCount === 0;
    console.log(`  Existing swap records: ${existingSwapCount}`);
    console.log(`  Is first-time swap: ${isFirstTimeSwap}`);

    // Nếu là lần đầu đổi pin → Không cho dùng API này, yêu cầu dùng API lấy pin lần đầu
    if (isFirstTimeSwap) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Xe này chưa lấy pin lần đầu. Vui lòng sử dụng lấy pin lần đầu trước khi thực hiện đổi pin.',
        data: {
          vehicle_id: vehicle_id,
          existing_swap_count: existingSwapCount,
          is_first_time: true,
          required_action: 'Use POST /api/swap/first-time-pickup or POST /api/swap/execute-first-time-with-booking'
        }
      });
    }

    // Bước 1.5: Lấy battery_type_id của vehicle
    console.log('\n🔍 Step 1.5: Getting battery type of vehicle...');
    const vehicle = await db.Vehicle.findByPk(vehicle_id, {
      attributes: ['vehicle_id', 'model_id', 'driver_id'],
      include: [{
        model: db.VehicleModel,
        as: 'model',
        attributes: ['model_id', 'battery_type_id'],
        include: [{
          model: db.BatteryType,
          as: 'batteryType',
          attributes: ['battery_type_id']
        }]
      }],
      transaction
    });

    if (!vehicle || !vehicle.model) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin xe hoặc loại pin của xe'
      });
    }
    const driverId = vehicle.driver_id;
    const vehicleBatteryTypeId = vehicle.model.battery_type_id;
    console.log(`✅ Vehicle battery type: ${vehicleBatteryTypeId} (${vehicle.model.batteryType?.type_name})`);
    console.log(`driverId: ${driverId}`);
    // Bước 2: Tự động lấy pin mới từ DB
    console.log('\n📤 Step 2: Finding available batteries to swap OUT...');
    
    const requiredQuantity = batteriesIn.length;
    const availableSlots = await swapBatteryService.getAvailableBatteriesForSwap(
      parseInt(station_id),
      parseInt(vehicleBatteryTypeId),
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

    

    

    console.log(`✅ Vehicle has previous swap records. Proceeding with battery swap...`);

    // Bước 5: Tạo swap records và tính soh_usage đồng thời
    console.log('\n📝 Step 5: Creating swap records and calculating soh_usage...');
    const swapRecords = [];
    let totalSohUsage = 0;

    for (let i = 0; i < batteriesIn.length; i++) {
      const batteryIn = batteriesIn[i];
      const batteryOut = batteriesOut[i];

      const batteryInData = await db.Battery.findByPk(batteryIn.battery_id, { transaction });
      const batteryOutData = await db.Battery.findByPk(batteryOut.battery_id, { transaction });

      // Query previous swap TRƯỚC KHI tạo swap mới (chỉ khi KHÔNG phải lần đầu)
      let previousSwapRecord = null;
        previousSwapRecord = await db.SwapRecord.findOne({
          where: {
            vehicle_id: vehicle_id,
            battery_id_out: batteryIn.battery_id // Pin đưa vào lần này = Pin lấy ra lần trước
          },
          order: [['swap_time', 'DESC']],
          transaction
        });
      

      // Tạo swap record
      const swapRecord = await swapBatteryService.createSwapRecord({
        driver_id : driverId,
        vehicle_id,
        station_id,
        battery_id_in: batteryIn.battery_id,
        battery_id_out: batteryOut.battery_id,
        soh_in: batteryInData.current_soh,
        soh_out: batteryOutData.current_soh
      });

      swapRecords.push(swapRecord);
      console.log(`  ✅ Swap record created: ${swapRecord.swap_id}`);

      // Tính soh_usage ngay sau khi tạo (chỉ khi KHÔNG phải lần đầu)
      if (!isFirstTimeSwap && previousSwapRecord) {
        const sohDiff = swapRecord.soh_in - previousSwapRecord.soh_out;
        totalSohUsage += sohDiff;
        
        console.log(`  📉 Battery ${swapRecord.battery_id_in}:`);
        console.log(`     - SOH lần trước (out): ${previousSwapRecord.soh_out}%`);
        console.log(`     - SOH lần này (in): ${swapRecord.soh_in}%`);
        console.log(`     - SOH usage: ${sohDiff}%`);
      } else if (!isFirstTimeSwap) {
        console.log(`  ⚠️ No previous swap found for battery ${swapRecord.battery_id_in}`);
      }
    }

    // Bước 6: Update subscription.soh_usage (chỉ khi KHÔNG phải lần đầu và có thay đổi)
      console.log('\n📊 Step 6: Updating subscription soh_usage...');
      
    

// ✅ Query subscription TRƯỚC
const subscription = await db.Subscription.findOne({
  where: {
    vehicle_id: vehicle_id,
    status: 'active'
  },
  transaction
});

if (!subscription) {
  console.log(`  ⚠️ No active subscription found for vehicle ${vehicle_id}`);
} else {
  const newSwapCount = subscription.swap_count + swapRecords.length;

  if (!isFirstTimeSwap && totalSohUsage !== 0) {
    // Cập nhật CẢ soh_usage VÀ swap_count
    const currentSohUsage = parseFloat(subscription.soh_usage) || 0;
    const newSohUsage = currentSohUsage + totalSohUsage;

    await db.Subscription.update(
      { 
        soh_usage: newSohUsage, 
        swap_count: newSwapCount 
      },
      {
        where: { subscription_id: subscription.subscription_id },
        transaction
      }
    );

    console.log(`  ✅ Subscription updated:`);
    console.log(`     - soh_usage: ${currentSohUsage.toFixed(2)}% → ${newSohUsage.toFixed(2)}% (Δ ${totalSohUsage > 0 ? '+' : ''}${totalSohUsage.toFixed(2)}%)`);
    console.log(`     - swap_count: ${subscription.swap_count} → ${newSwapCount} (+${swapRecords.length})`);
  } 
}

    await transaction.commit();

    console.log('\n✅ ========== SWAP COMPLETED SUCCESSFULLY ==========\n');

    return res.status(200).json({
      success: true,
      message: 'Đổi pin thành công',
      data: {
        driver_id : driverId,
        vehicle_id,
        station_id,
        battery_type_id: vehicleBatteryTypeId,
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
 * API: Validate booking và tự động thực hiện swap với booking_id
 * POST /api/swap/validate-with-booking
 * Body:
 * {
 *   "booking_id": "uuid",
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1,
 *   "battery_type_id": 1,
 *   "batteriesIn": [
 *     { "slot_id": 1, "battery_id": "uuid-old-1" },
 *     { "slot_id": 2, "battery_id": "uuid-old-2" }
 *   ]
 * }
 */
async function validateAndPrepareSwapWithBooking(req, res) {
  try {
    const { booking_id, vehicle_id, station_id, batteriesIn } = req.body;

    // Validation input
    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: 'booking_id là bắt buộc'
      });
    }

    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id là bắt buộc'
      });
    }

    if (!station_id) {
      return res.status(400).json({
        success: false,
        message: 'station_id là bắt buộc'
      });
    }

    console.log(`\n🔍 ========== VALIDATING SWAP WITH BOOKING ==========`);
    console.log(`Booking ID: ${booking_id}`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);

    // Bước 1: Kiểm tra xe có subscription hợp lệ không
    console.log('\n🔍 Step 1: Checking vehicle subscription...');
    const subscription = await db.Subscription.findOne({
      where: {
        vehicle_id: vehicle_id,
        status: 'active'
      },
      include: [
        {
          model: db.SubscriptionPlan,
          as: 'plan',
          attributes: ['plan_id', 'plan_name', 'plan_fee']
        }
      ]
    });

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'Xe không có gói đăng ký hợp lệ (active). Vui lòng đăng ký gói dịch vụ trước.'
      });
    }

    console.log(`✅ Vehicle has active subscription: ${subscription.plan.plan_name}`);

    // Bước 2: Kiểm tra xe đã lấy pin lần đầu chưa (check swap records)
    console.log('\n🔍 Step 2: Checking if this is first-time pickup...');
    const existingSwapCount = await db.SwapRecord.count({
      where: {
        vehicle_id: vehicle_id
      }
    });

    const isFirstTime = existingSwapCount === 0;
    console.log(`   - Existing swap records: ${existingSwapCount}`);
    console.log(`   - Is first-time: ${isFirstTime}`);

    // Bước 3: Validate booking có hợp lệ không
    console.log('\n🔍 Step 3: Validating booking...');
    const booking = await db.Booking.findOne({
      where: {
        booking_id: booking_id,
        vehicle_id: vehicle_id,
        station_id: station_id,
        status: 'pending'
      },
      include: [
        {
          model: db.BookingBattery,
          as: 'bookingBatteries',
          include: [
            {
              model: db.Battery,
              as: 'battery'
            }
          ]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy booking hợp lệ với vehicle_id và station_id đã cho, hoặc booking không còn ở trạng thái pending'
      });
    }

    // Kiểm tra booking có còn trong khoảng thời gian hợp lệ không
    const now = new Date();
    const createTime = new Date(booking.create_time);
    const scheduledTime = new Date(booking.scheduled_time);

    console.log(`   - Create time: ${createTime.toISOString()}`);
    console.log(`   - Scheduled time: ${scheduledTime.toISOString()}`);
    console.log(`   - Current time: ${now.toISOString()}`);

    if (now < createTime || now > scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Booking không còn trong khoảng thời gian hợp lệ. Thời gian đổi pin phải nằm giữa thời gian tạo đơn và thời gian đã đặt lịch.',
        data: {
          create_time: createTime,
          scheduled_time: scheduledTime,
          current_time: now
        }
      });
    }

    console.log(`✅ Booking hợp lệ (trong khoảng thời gian cho phép)`);

    // Bước 4: Lấy danh sách pin đã đặt từ BookingBatteries và thông tin slot
    console.log('\n🔍 Step 4: Getting booked batteries from BookingBatteries...');
    const bookedBatteriesRaw = booking.bookingBatteries || [];
    
    if (bookedBatteriesRaw.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking không có pin nào được đặt trước'
      });
    }
    
    console.log(`   - Found ${bookedBatteriesRaw.length} booked batteries`);
    
    // Lấy thông tin slot cho từng battery
    const bookedBatteries = [];
    for (const bb of bookedBatteriesRaw) {
      const battery = bb.battery;
      
      // Tìm slot chứa battery này
      const slot = await db.CabinetSlot.findOne({
        where: { 
          battery_id: battery.battery_id,
          slot_status: ['charging', 'charged', 'locked']
        },
        attributes: ['slot_id', 'slot_number', 'slot_status']
      });

      if (!slot) {
        return res.status(400).json({
          success: false,
          message: `Pin  (${battery.battery_id}) không tìm thấy slot hoặc không ở trạng thái sẵn sàng`,
          data: {
            battery_id: battery.battery_id
          }
        });
      }

      bookedBatteries.push({
        battery_id: battery.battery_id,
        current_soc: battery.current_soc,
        current_soh: battery.current_soh,
        slot_id: slot.slot_id,
        slot_number: slot.slot_number,
        slot_status: slot.slot_status
      });

      console.log(`   - Battery ${battery.battery_id}: SOC=${battery.current_soc}%, SOH=${battery.current_soh}% at Slot ${slot.slot_id} (${slot.slot_status})`);
    }

    // Bước 5: Validate dựa trên first-time hay không
    let validBatteries = [];
    let invalidBatteries = [];

    if (!isFirstTime) {
      // KHÔNG phải lần đầu → Cần validate batteriesIn
      console.log('\n🔍 Step 5: Validating batteries IN (not first-time)...');
      
      if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'batteriesIn phải là mảng không rỗng (không phải lần đầu lấy pin)'
        });
      }

      // Kiểm tra số lượng pin đưa vào phải khớp với số lượng pin đã book
      if (batteriesIn.length !== bookedBatteries.length) {
        return res.status(400).json({
          success: false,
          message: `Số lượng pin đưa vào (${batteriesIn.length}) không khớp với số lượng pin đã đặt (${bookedBatteries.length})`,
          data: {
            batteries_in_count: batteriesIn.length,
            booked_batteries_count: bookedBatteries.length
          }
        });
      }

      const validation = await swapBatteryService.validateBatteryInsertion(batteriesIn, vehicle_id);
      validBatteries = validation.results.filter(r => r.valid);
      invalidBatteries = validation.results.filter(r => !r.valid);

      console.log(`✅ Valid batteries: ${validBatteries.length}/${batteriesIn.length}`);
      if (invalidBatteries.length > 0) {
        console.log(`❌ Invalid batteries: ${invalidBatteries.length}`);
        invalidBatteries.forEach(b => {
          console.log(`   - Battery ${b.battery_id}: ${b.error}`);
        });
        
        return res.status(400).json({
          success: false,
          message: 'Có pin không hợp lệ trong danh sách pin đưa vào',
          data: {
            invalid_batteries: invalidBatteries.map(b => ({
              battery_id: b.battery_id,
              slot_id: b.slot_id,
              error: b.error
            }))
          }
        });
      }
    } else {
      // LẦN ĐẦU → Không cần batteriesIn
      console.log('\n🔍 Step 5: Skipping batteries IN validation (first-time pickup)...');
      console.log(`   ℹ️ First-time pickup does not require batteriesIn`);
    }

    // Bước 6: Kiểm tra pin đã book có còn sẵn sàng không
    console.log('\n🔍 Step 6: Validating booked batteries availability...');
    for (const bb of bookedBatteries) {
      const battery = bb.battery;
      
      // Kiểm tra pin có đang ở slot và ready không
      const slot = await db.CabinetSlot.findOne({
        where: {
          battery_id: battery.battery_id,
          slot_status: ['charging', 'charged', 'locked']
        }
      });

      if (!slot) {
        return res.status(400).json({
          success: false,
          message: `Pin đã đặt ${battery.battery_id} không còn sẵn sàng hoặc không ở trạng thái 'charging'/'charged'/'locked'`,
          data: {
            battery_id: battery.battery_id,
            battery_serial: battery.battery_serial
          }
        });
      }

      console.log(`   ✅ Battery ${battery.battery_id} is ready at slot ${slot.slot_id}`);
    }

    console.log('\n✅ Tất cả kiểm tra đều hợp lệ. Sẵn sàng để xử lý với booking.');
    console.log('✅ ========== VALIDATION WITH BOOKING COMPLETE ==========\n');

    // Trả về kết quả validation
    const responseData = {
      success: true,
      message: isFirstTime 
        ? 'Validation thành công. Sẵn sàng để lấy pin lần đầu với booking.'
        : 'Validation thành công. Sẵn sàng để thực hiện đổi pin với booking.',
      ready_to_execute: true,
      is_first_time: isFirstTime, // ← FLAG quan trọng để frontend biết gọi API nào
      data: {
        booking_id,
        driver_id,
        vehicle_id,
        station_id: parseInt(station_id),
        validation_summary: {
          is_first_time: isFirstTime,
          has_active_subscription: true,
          total_batteries_in: isFirstTime ? 0 : batteriesIn.length,
          valid_batteries: isFirstTime ? 0 : validBatteries.length,
          booked_batteries_out: bookedBatteries.length
        },
        booked_batteries_out: bookedBatteries.map(bb => ({
          battery_id: bb.battery_id,
          current_soc: bb.battery.current_soc,
          current_soh: bb.battery.current_soh,
          battery_serial: bb.battery.battery_serial
        })),
        booking_info: {
          booking_id: booking.booking_id,
          status: booking.status,
          create_time: booking.create_time,
          scheduled_time: booking.scheduled_time
        }
      }
    };

    // Thêm valid_batteries_in chỉ khi không phải lần đầu
    if (!isFirstTime) {
      responseData.data.valid_batteries_in = validBatteries.map(v => ({
        slot_id: v.slot_id,
        battery_id: v.battery_id,
        battery_soh: v.battery_soh,
        battery_soc: v.battery_soc,
        new_slot_status: v.new_slot_status
      }));
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error in validateAndPrepareSwapWithBooking:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi validate và chuẩn bị đổi pin với booking',
      error: error.message
    });
  }
}

/**
 * Hàm nội bộ thực hiện swap với booking (được gọi từ validate booking)
 */
async function executeSwapWithBookingInternal(params, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      booking_id,
      vehicle_id,
      station_id,
      batteriesIn,
      batteriesOut
    } = params;

    console.log(`\n🔄 ========== EXECUTING BATTERY SWAP WITH BOOKING ==========`);
    console.log(`Booking ID: ${booking_id}`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);
    console.log(`Batteries OUT (booked): ${batteriesOut.length}`);

    const swapResults = [];
    // Bước 1.5: Lấy battery_type_id của vehicle
    console.log('\n🔍 Step 1.5: Getting battery type of vehicle...');
    const vehicle = await db.Vehicle.findByPk(vehicle_id, {
      attributes: ['vehicle_id', 'model_id', 'driver_id'],
      include: [{
        model: db.VehicleModel,
        as: 'model',
        attributes: ['model_id', 'battery_type_id'],
        include: [{
          model: db.BatteryType,
          as: 'batteryType',
          attributes: ['battery_type_id']
        }]
      }],
      transaction
    });

    if (!vehicle || !vehicle.model) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin xe hoặc loại pin của xe'
      });
    }
    const driverId = vehicle.driver_id;
    const vehicleBatteryTypeId = vehicle.model.battery_type_id;
    console.log(`✅ Vehicle battery type: ${vehicleBatteryTypeId} (${vehicle.model.batteryType?.type_name})`);
    console.log(`driverId: ${driverId}`);

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

      await swapBatteryService.updateSlotStatus(slot_id, newSlotStatus, transaction);
      await swapBatteryService.updateOldBatteryToSlot(battery_id, slot_id, transaction);

      swapResults.push({
        type: 'IN',
        battery_id,
        slot_id,
        soh: soh_in,
        slot_status: newSlotStatus
      });
    }

    // Bước 2: Xử lý pin mới lấy ra (từ booking)
    console.log('\n📤 Step 2: Processing batteries OUT (booked batteries)...');
    const processedBatteriesOut = [];
    
    for (const batteryOut of batteriesOut) {
      const battery_id = batteryOut.battery_id;

      // Tìm slot chứa pin này
      const slot = await db.CabinetSlot.findOne({
        where: { battery_id: battery_id },
        include: [{ model: db.Battery, as: 'battery' }],
        transaction
      });

      if (!slot) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy slot chứa battery ${battery_id}`
        });
      }

      const slot_id = slot.slot_id;
      const soh_out = slot.battery.current_soh;
      const soc_out = slot.battery.current_soc;

      console.log(`  📦 Battery ${battery_id} (SOC: ${soc_out}%, SOH: ${soh_out}%) ← Slot ${slot_id}`);

      await swapBatteryService.updateSlotStatus(slot_id, 'empty', transaction);
      await swapBatteryService.updateNewBatteryToVehicle(battery_id, vehicle_id, transaction);

      processedBatteriesOut.push({
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

    // Bước 3: Kiểm tra xe có swap record trước đó không
    console.log('\n📝 Step 3: Checking if this is first-time swap...');
    const existingSwapCount = await db.SwapRecord.count({
      where: {
        vehicle_id: vehicle_id,
        battery_id_in: { [db.Sequelize.Op.ne]: null }
      },
      transaction
    });
    
    const isFirstTimeSwap = existingSwapCount === 0;
    console.log(`  Existing swap records (with battery_in): ${existingSwapCount}`);
    console.log(`  Is first-time swap: ${isFirstTimeSwap}`);

    // Bước 4: Tạo swap records và tính soh_usage
    console.log('\n📝 Step 4: Creating swap records and calculating soh_usage...');
    const swapRecords = [];
    let totalSohUsage = 0;

    for (let i = 0; i < batteriesIn.length; i++) {
      const batteryIn = batteriesIn[i];
      const batteryOut = processedBatteriesOut[i];

      const batteryInData = await db.Battery.findByPk(batteryIn.battery_id, { transaction });
      const batteryOutData = await db.Battery.findByPk(batteryOut.battery_id, { transaction });

      // Query previous swap (chỉ khi KHÔNG phải lần đầu)
      let previousSwapRecord = null;
      if (!isFirstTimeSwap) {
        previousSwapRecord = await db.SwapRecord.findOne({
          where: {
            vehicle_id: vehicle_id,
            battery_id_out: batteryIn.battery_id
          },
          order: [['swap_time', 'DESC']],
          transaction
        });
      }

      // Tạo swap record (với booking_id)
      const swapRecord = await swapBatteryService.createSwapRecordWithBooking({
        driver_id : driverId,
        vehicle_id,
        station_id,
        battery_id_in: batteryIn.battery_id,
        battery_id_out: batteryOut.battery_id,
        soh_in: batteryInData.current_soh,
        soh_out: batteryOutData.current_soh
      }, transaction);

      swapRecords.push(swapRecord);
      console.log(`  ✅ Swap record created: ${swapRecord.swap_id} (with booking_id: ${booking_id})`);

      // Tính soh_usage (chỉ khi KHÔNG phải lần đầu)
      if (!isFirstTimeSwap && previousSwapRecord) {
        const sohDiff = swapRecord.soh_in - previousSwapRecord.soh_out;
        totalSohUsage += sohDiff;
        
        console.log(`  📉 Battery ${swapRecord.battery_id_in}:`);
        console.log(`     - SOH lần trước (out): ${previousSwapRecord.soh_out}%`);
        console.log(`     - SOH lần này (in): ${swapRecord.soh_in}%`);
        console.log(`     - SOH usage: ${sohDiff}%`);
      } else if (!isFirstTimeSwap) {
        console.log(`  ⚠️ No previous swap found for battery ${swapRecord.battery_id_in}`);
      }
    }

    // Bước 5: Update subscription.soh_usage
    if (!isFirstTimeSwap && totalSohUsage !== 0) {
      console.log('\n📊 Step 5: Updating subscription soh_usage...');
      
      const subscription = await db.Subscription.findOne({
        where: {
          vehicle_id: vehicle_id,
          status: 'active'
        },
        transaction
      });

      if (subscription) {
        const currentSohUsage = parseFloat(subscription.soh_usage) || 0;
        const newSohUsage = currentSohUsage + totalSohUsage;

        await db.Subscription.update(
          { soh_usage: newSohUsage },
          {
            where: { subscription_id: subscription.subscription_id },
            transaction
          }
        );

        console.log(`  ✅ Subscription soh_usage updated: ${currentSohUsage.toFixed(2)}% → ${newSohUsage.toFixed(2)}% (Δ ${totalSohUsage > 0 ? '+' : ''}${totalSohUsage.toFixed(2)}%)`);
      } else {
        console.log(`  ⚠️ No active subscription found for vehicle ${vehicle_id}`);
      }
    } 
      else {
      console.log('\n📊 Step 5: No soh_usage change (totalSohUsage = 0)');
    }

    // Bước 6: Update booking status thành 'completed'
    console.log('\n✅ Step 6: Updating booking status to completed...');
    await db.Booking.update(
      { status: 'completed' },
      {
        where: { booking_id: booking_id },
        transaction
      }
    );
    console.log(`  ✅ Booking ${booking_id} status updated to 'completed'`);

    await transaction.commit();

    console.log('\n✅ ========== SWAP WITH BOOKING COMPLETED SUCCESSFULLY ==========\n');

    return res.status(200).json({
      success: true,
      message: 'Đổi pin thành công với booking',
      data: {
        booking_id,
        driver_id : driverId,
        vehicle_id,
        station_id,
        battery_type_id : vehicleBatteryTypeId,
        swap_summary: {
          batteries_in: batteriesIn.length,
          batteries_out: processedBatteriesOut.length,
          swap_records: swapRecords.length
        },
        batteries_out_info: processedBatteriesOut,
        swap_results: swapResults,
        swap_records: swapRecords
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error in executeSwapWithBookingInternal:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện đổi pin với booking',
      error: error.message
    });
  }
}

/**
 * API 5: Execute swap thủ công (sau khi validate thành công)
 * POST /api/swap/execute
 * Body:
 * {
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1,
 *   "battery_type_id": 1,
 *   "batteriesIn": [
 *     { "slot_id": 1, "battery_id": "uuid-old-1" },
 *     { "slot_id": 2, "battery_id": "uuid-old-2" }
 *   ]
 * }
 */
async function executeSwap(req, res) {
  const { vehicle_id, station_id, batteriesIn } = req.body;

  // Validation input
  if (!vehicle_id) {
    return res.status(400).json({
      success: false,
      message: 'vehicle_id là bắt buộc'
    });
  }

  if (!station_id) {
    return res.status(400).json({
      success: false,
      message: 'station_id là bắt buộc'
    });
  }

  if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'batteriesIn phải là mảng không rỗng'
    });
  }

  return await executeSwapInternal(req.body, res);
}

/**
 * API: Execute swap với booking (sau khi validate thành công)
 * POST /api/swap/execute-with-booking
 * Body:
 * {
 *   "booking_id": "uuid",
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1,
 *   "battery_type_id": 1,
 *   "batteriesIn": [
 *     { "slot_id": 1, "battery_id": "uuid-old-1" },
 *     { "slot_id": 2, "battery_id": "uuid-old-2" }
 *   ],
 *   "batteriesOut": [
 *     { "battery_id": "uuid-new-1" },
 *     { "battery_id": "uuid-new-2" }
 *   ]
 * }
 */
async function executeSwapWithBooking(req, res) {
  const { booking_id, vehicle_id, station_id, batteriesIn, batteriesOut } = req.body;

  // Validation input
  if (!booking_id || !vehicle_id || !station_id) {
    return res.status(400).json({
      success: false,
      message: 'booking_id, vehicle_id, station_id là bắt buộc'
    });
  }

  if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'batteriesIn phải là mảng không rỗng'
    });
  }

  if (!batteriesOut || !Array.isArray(batteriesOut) || batteriesOut.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'batteriesOut phải là mảng không rỗng'
    });
  }

  if (batteriesIn.length !== batteriesOut.length) {
    return res.status(400).json({
      success: false,
      message: 'Số lượng batteriesIn phải bằng batteriesOut'
    });
  }

  return await executeSwapWithBookingInternal({
    booking_id,
    vehicle_id,
    station_id,
    batteriesIn,
    batteriesOut
  }, res);
}

/**
 * =====================================================
 * EXECUTE: First-Time Battery Pickup WITH BOOKING (Internal)
 * =====================================================
 * Thực hiện lấy pin lần đầu với booking (không có batteriesIn)
 * Chỉ xử lý batteriesOut từ booking
 */
async function executeFirstTimePickupWithBookingInternal(params, res) {
  const { booking_id, vehicle_id, station_id, bookedBatteries } = params;
  const transaction = await db.sequelize.transaction();

  try {
    console.log('\n========================================');
    console.log('🔋 FIRST-TIME BATTERY PICKUP WITH BOOKING - EXECUTION');
    console.log('========================================');
    console.log('📦 Parameters:', JSON.stringify(params, null, 2));

    // Step 1: Get booking
    const booking = await db.Booking.findByPk(booking_id, { transaction });
    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Booking không tồn tại'
      });
    }

    // Step 2: Get vehicle
    const vehicle = await db.Vehicle.findByPk(vehicle_id, {
      attributes: ['vehicle_id', 'driver_id'],
      include: [{ model: db.VehicleModel, as: 'VehicleModel' }],
      transaction
    });
    if (!vehicle) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Vehicle không tồn tại'
      });
    }
    const driverId = vehicle.driver_id;
    // Step 3: Process batteriesOut (from booking)
    console.log(`\n📤 Processing ${bookedBatteries.length} booked batteries OUT...`);
    const processedBatteriesOut = [];

    for (const bookedBattery of bookedBatteries) {
      const { slot_id, battery_id } = bookedBattery;

      // Get battery info
      const battery = await db.Battery.findByPk(battery_id, { transaction });
      if (!battery) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Battery ${battery_id} không tồn tại`
        });
      }

      console.log(`  ✅ Battery ${battery_id} → Slot ${slot_id}`);

      // Update battery to vehicle
      await swapBatteryService.updateNewBatteryToVehicle(
        vehicle_id,
        battery_id,
        transaction
      );

      // Update slot status (from 'available' to 'empty')
      await swapBatteryService.updateSlotStatus(slot_id, 'empty', null, transaction);

      processedBatteriesOut.push({
        slot_id,
        battery_id,
        soh: battery.soh
      });
    }

    // Step 4: Create SwapRecord with battery_id_in = null (first-time)
    console.log('\n📝 Creating SwapRecord (First-Time)...');
    const swapRecord = await swapBatteryService.createSwapRecordWithBooking(
      {
        driver_id: driverId,
        vehicle_id,
        battery_id_in: null, // First-time: no battery IN
        soh_in: null,
        battery_id_out: bookedBatteries[0].battery_id, // First battery out
        soh_out: processedBatteriesOut[0].soh,
        station_id,

      },
      transaction
    );
    console.log(`  ✅ SwapRecord created: ${swapRecord.swap_id}`);

    // Step 6: Update booking status to 'completed'
    await booking.update({ status: 'completed' }, { transaction });
    console.log('  ✅ Booking status updated to COMPLETED');

    // Commit transaction
    await transaction.commit();

    console.log('\n========================================');
    console.log('✅ FIRST-TIME PICKUP WITH BOOKING COMPLETED!');
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Lấy pin lần đầu với booking thành công!',
      data: {
        swap_record: {
          swap_id: swapRecord.swap_id,
          booking_id: swapRecord.booking_id,
          driver_id: swapRecord.driver_id,
          vehicle_id: swapRecord.vehicle_id,
          station_id: swapRecord.station_id,
          swap_time: swapRecord.swap_time,
          battery_id_in: null,
          soh_in: 0,
          battery_id_out: swapRecord.battery_id_out,
          soh_out: swapRecord.soh_out
        },
        batteries_out: processedBatteriesOut,
        vehicle: {
          vehicle_id: vehicle.vehicle_id,
          driver_id: vehicle.driver_id
        },
        booking: {
          booking_id: booking.booking_id,
          status: booking.status
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ FIRST-TIME PICKUP WITH BOOKING ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện lấy pin lần đầu với booking',
      error: error.message
    });
  }
}

/**
 * =====================================================
 * API: Execute First-Time Battery Pickup WITH BOOKING
 * =====================================================
 * POST /api/swap/execute-first-time-with-booking
 * 
 * Body:
 * {
 *   "booking_id": "uuid",
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1,
 *   "bookedBatteries": [
 *     { "slot_id": 1, "battery_id": "uuid-new-1" },
 *     { "slot_id": 2, "battery_id": "uuid-new-2" }
 *   ]
 * }
 */
async function executeFirstTimePickupWithBooking(req, res) {
  const { booking_id, vehicle_id, station_id, bookedBatteries } = req.body;

  // Validation input
  if (!booking_id || !vehicle_id) {
    return res.status(400).json({
      success: false,
      message: 'booking_id, vehicle_id là bắt buộc'
    });
  }

  if (!station_id) {
    return res.status(400).json({
      success: false,
      message: 'station_id là bắt buộc'
    });
  }

  if (!bookedBatteries || !Array.isArray(bookedBatteries) || bookedBatteries.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'bookedBatteries phải là mảng không rỗng'
    });
  }

  return await executeFirstTimePickupWithBookingInternal({
    booking_id,
    vehicle_id,
    station_id,
    bookedBatteries
  }, res);
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

/**
 * API: Lấy pin lần đầu cho xe mới
 * POST /api/swap/first-time-pickup
 * Body:
 * {
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1
 * }
 */
async function firstTimeBatteryPickup(req, res) {
  const transaction = await db.sequelize.transaction();
  try {
    const { driver_id, vehicle_id, station_id } = req.body;

    // Validation input
    if (!driver_id || !vehicle_id || !station_id) {
      return res.status(400).json({
        success: false,
        message: 'driver_id, vehicle_id và station_id là bắt buộc'
      });
    }

    console.log(`\n🚗 First-time battery pickup: driver=${driver_id}, vehicle=${vehicle_id}, station=${station_id}`);

    // Kiểm tra xe có subscription hợp lệ (active) không
    console.log('\n🔍 Checking vehicle subscription...');
    const subscription = await db.Subscription.findOne({
      where: {
        vehicle_id: vehicle_id,
        status: 'active'
      },
      include: [
        {
          model: db.SubscriptionPlan,
          as: 'plan',
          attributes: ['plan_id', 'plan_name', 'plan_fee']
        }
      ],
      transaction
    });

    if (!subscription) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Xe không có gói đăng ký hợp lệ (active). Vui lòng đăng ký gói dịch vụ trước khi lấy pin.'
      });
    }

    console.log(`✅ Vehicle has active subscription: ${subscription.plan.plan_name} (ID: ${subscription.subscription_id})`);

    // Kiểm tra xe đã lấy pin lần đầu chưa
    console.log('\n🔍 Checking if vehicle has already taken first-time battery...');
    const existingSwapCount = await db.SwapRecord.count({
      where: {
        vehicle_id: vehicle_id
      },
      transaction
    });

    if (existingSwapCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Xe này đã lấy pin lần đầu rồi. Không thể sử dụng chức năng lấy pin lần đầu nữa.',
        data: {
          swap_count: existingSwapCount
        }
      });
    }

    console.log(`✅ Vehicle has not taken first-time battery yet (swap count: ${existingSwapCount})`);

    // Lấy thông tin xe và pin sẵn sàng
    const pickupData = await swapBatteryService.getFirstTimeBatteries(vehicle_id, station_id, transaction);
    const { vehicle, battery_type_id, battery_quantity, available_slots } = pickupData;

    console.log(`📦 Vehicle model: ${vehicle.model.name}, needs ${battery_quantity} batteries of type ${battery_type_id}`);
    console.log(`✅ Found ${available_slots.length} available batteries`);

    const swapRecords = [];

    // Xử lý từng pin lấy ra
    for (let i = 0; i < battery_quantity; i++) {
      const slot = available_slots[i];
      const batteryOut = slot.battery;

      console.log(`\n🔋 Processing battery ${i + 1}/${battery_quantity}:`);
      console.log(`   - Battery OUT: ${batteryOut.battery_id} (SOC: ${batteryOut.current_soc}%, SOH: ${batteryOut.current_soh}%)`);

      // 1. Cập nhật slot thành empty
      await swapBatteryService.updateSlotStatus(slot.slot_id, 'empty', transaction);
      console.log(`   ✅ Slot ${slot.slot_id} set to 'empty'`);

      // 2. Cập nhật battery: gán vào vehicle
      await swapBatteryService.updateNewBatteryToVehicle(batteryOut.battery_id, vehicle_id, transaction);
      console.log(`   ✅ Battery ${batteryOut.battery_id} assigned to vehicle ${vehicle_id}`);

      // 3. Tạo SwapRecord với battery_id_in = null, soh_in = null
      const swapRecord = await swapBatteryService.createSwapRecord(
        {
          driver_id,
          vehicle_id,
          station_id,
          battery_id_in: null,      // Không có pin trả về
          battery_id_out: batteryOut.battery_id,
          soh_in: null,                // Không có pin trả về
          soh_out: batteryOut.current_soh
        },
        transaction
      );
      console.log(`   ✅ SwapRecord created: ${swapRecord.swap_id}`);
      swapRecords.push(swapRecord);
    }

    // Update subscription swap_count (tăng theo số lượng swap records đã tạo)
    // Mỗi SwapRecord = 1 lần đổi pin thành công
    console.log(`\n📊 Updating subscription swap_count...`);
    const newSwapCount = subscription.swap_count + swapRecords.length;
    await subscription.update({ swap_count: newSwapCount }, { transaction });
    console.log(`   ✅ Subscription swap_count updated: ${subscription.swap_count} → ${newSwapCount} (+${swapRecords.length} swap records)`);

    // Commit transaction
    await transaction.commit();
    console.log('✅ First-time pickup completed successfully\n');

    return res.status(200).json({
      success: true,
      message: `Lấy pin lần đầu thành công cho xe ${vehicle.license_plate}`,
      data: {
        vehicle: {
          vehicle_id: vehicle.vehicle_id,
          license_plate: vehicle.license_plate,
          model: vehicle.model.name,
        },
        batteries_picked: swapRecords.length,
        swap_records: swapRecords.map(record => ({
          swap_id: record.swap_id,
          battery_id_out: record.battery_id_out,
          soh_out: record.soh_out,
          swap_time: record.swap_time
        }))
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error in firstTimeBatteryPickup:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy pin lần đầu',
      error: error.message
    });
  }
}

async function getEmptySlots(req, res) {
  try {
    const { station_id } = req.query;

    if (!station_id) {
      return res.status(400).json({
        success: false,
        message: 'station_id là bắt buộc'
      });
    }

    console.log(`\n🔍 Getting empty slots for station: ${station_id}`);

    const emptySlots = await swapBatteryService.getEmptySlots(parseInt(station_id));

    console.log(`✅ Found ${emptySlots.length} empty slots at station ${station_id}`);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách slot trống thành công',
      data: {
        station_id: parseInt(station_id),
        total_empty_slots: emptySlots.length,
        empty_slots: emptySlots.map(slot => ({
          slot_id: slot.slot_id,
          slot_number: slot.slot_number,
          slot_status: slot.slot_status,
          cabinet_id: slot.cabinet_id,
          battery_id: slot.battery_id
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error in getEmptySlots:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách slot trống',
      error: error.message
    });
  }
}

module.exports = {
  validateAndPrepareSwap, // API 4: Validate và chuẩn bị đổi pin (không có booking)
  validateAndPrepareSwapWithBooking, // API 4b: Validate và chuẩn bị đổi pin với booking
  executeSwap, // API 5: Thực hiện đổi pin (không có booking)
  executeSwapWithBooking, // API 5b: Thực hiện đổi pin với booking
  executeFirstTimePickupWithBooking, // ← THÊM MỚI lấy pin lần đầu với booking và không cần validate
  getAvailableBatteries, // Lấy danh sách pin sẵn sàng để đổi
  firstTimeBatteryPickup, // Lấy lần đầu không có booking và không cần validate
  getEmptySlots // Lấy danh sách slot trống tại station
};