const swapBatteryService = require('../services/swap_battery.service');
const subscriptionService = require('../services/subscription.service');
const vehicleService = require('../services/vehicle.service');
const db = require('../models');
const { where } = require('sequelize');
const routeConfig = require('../config/route.config');
const sohMaintenanceThreshole = routeConfig.getConfig()?.soh_maintenance_threshole || 70;
/**
 * API 4: Validate và chuẩn bị đổi pin 1-1
 * POST /api/swap/validate-and-prepare
 * Body:
 * {
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1,
 *   "requested_quantity": 2,
 *   "batteriesIn": [
 *     { "slot_id": 1, "battery_id": "uuid-old-1" },
 *     { "slot_id": 2, "battery_id": "uuid-old-2" }
 *   ]
 * }
 */
async function validateAndPrepareSwap(req, res) {
  try {
    const { driver_id, vehicle_id, station_id, requested_quantity, batteriesIn } = req.body;

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

    // Kiểm tra batteriesIn là bắt buộc (đổi pin 1-1)
    if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'batteriesIn is required (must have old battery to exchange)'
      });
    }

    console.log(`\n🔍 ========== VALIDATING SWAP PREPARATION ==========`);
    console.log(`Driver: ${driver_id}`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);
    console.log(`Requested Quantity: ${requested_quantity}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);

    // Bước 1: Kiểm tra vehicle có tồn tại và thuộc về driver không
    console.log('\n🔍 Step 1: Validating vehicle ownership and battery type...');
    const vehicle = await vehicleService.findVehicleWithModel(vehicle_id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle found with given vehicle_id'
      });
    }

    // Kiểm tra xe có thuộc về driver không
    if (vehicle.driver_id !== driver_id) {
      return res.status(403).json({
        success: false,
        message: `Vehicle ${vehicle.license_plate} does not belong to this driver. Not allowed to swap batteries for someone else's vehicle.`,
        data: {
          vehicle_id: vehicle.vehicle_id,
          vehicle_license_plate: vehicle.license_plate,
          vehicle_driver_id: vehicle.driver_id,
          requested_driver_id: driver_id
        }
      });
    }

    console.log(`   ✅ Vehicle ${vehicle.license_plate} belongs to driver ${driver_id}`);

    // Lấy battery_type_id của xe
    const vehicleBatteryTypeId = vehicle.model.battery_type_id;

    // Kiểm tra số lượng pin không vượt quá battery_slot của vehicle model
    const maxBatterySlots = vehicle.model.battery_slot;
    if (requested_quantity > maxBatterySlots) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${requested_quantity}) exceeds the maximum battery slots of vehicle ${vehicle.model.name} (${maxBatterySlots} slots)`,
        data: {
          requested_quantity: requested_quantity,
          max_battery_slots: maxBatterySlots,
          vehicle_model: vehicle.model.name
        }
      });
    }

    console.log(`   ✅ Requested quantity (${requested_quantity}) is within vehicle capacity (${maxBatterySlots})`);

    // Kiểm tra số lượng pin đưa vào phải khớp với requested_quantity (đổi 1-1)
    if (batteriesIn.length !== requested_quantity) {
      return res.status(400).json({
        success: false,
        message: `The number of batteries provided (${batteriesIn.length}) must match the requested quantity (${requested_quantity})`,
        data: {
          batteries_in_count: batteriesIn.length,
          requested_quantity: requested_quantity
        }
      });
    }

    console.log(`   ✅ Batteries IN count matches requested quantity (${batteriesIn.length})`);
    

    // Bước 2: Validate pin đưa vào
    console.log('\n🔍 Step 2: Validating batteries IN...');
    const validation = await swapBatteryService.validateBatteryInsertion(batteriesIn, station_id, vehicle_id);

    // Lọc ra các pin hợp lệ và không hợp lệ
    const validBatteries = validation.results.filter(r => r.valid);
    const invalidBatteries = validation.results.filter(r => !r.valid);

    console.log(`✅ Valid batteries: ${validBatteries.length}/${batteriesIn.length}`);
    if (invalidBatteries.length > 0) {
      console.log(`❌ Invalid batteries: ${invalidBatteries.length}`);
      invalidBatteries.forEach(b => {
        console.log(`   - Battery ${b.battery_id}: ${b.error}`);
      });
    }

    const batteryCheckQuantity = validBatteries.length; // Số lượng pin hợp lệ

    // Bước 3: Kiểm tra pin sẵn sàng để đổi
    console.log('\n🔋 Step 3: Checking available batteries for swap...');
    const availableSlots = await swapBatteryService.getAvailableBatteriesForSwap(
      parseInt(station_id),
      parseInt(vehicleBatteryTypeId),
      batteryCheckQuantity
    );

    console.log(`✅ Available batteries (SOC >= 90%): ${availableSlots.length}/${batteryCheckQuantity}`);

    // Kiểm tra các điều kiện (đơn giản hóa - chỉ có logic đổi 1-1)
    const hasEnoughValidBatteries = validBatteries.length === requested_quantity;
    const hasEnoughAvailableBatteries = availableSlots.length >= batteryCheckQuantity;
    const canProceed = validBatteries.length > 0 && hasEnoughAvailableBatteries;

    // Xác định message và status
    let responseStatus = 200;
    let responseMessage = '';
    let readyToExecute = false;

    if (validBatteries.length === 0) {
      responseStatus = 400;
      responseMessage = 'No valid batteries were found. Please check the batteries inserted.';
    } else if (!hasEnoughAvailableBatteries) {
      responseStatus = 400;
      responseMessage = `Not enough batteries are available for swap. Required: ${batteryCheckQuantity}, Available: ${availableSlots.length}.`;
    } else if (!hasEnoughValidBatteries) {
      responseStatus = 400;
      responseMessage = `The number of valid batteries (${validBatteries.length}) does not match the requested quantity (${requested_quantity}). Please check again.`;
    } else {
      responseStatus = 200;
      readyToExecute = true;
      responseMessage = `All ${validBatteries.length} batteries are valid. Ready to execute the swap.`;
    }

    console.log(`\n📊 Validation Result: ${responseMessage}`);
    console.log(`✅ ========== VALIDATION COMPLETE ==========\n`);

    // Build response data
    const responseData = {
      success: canProceed,
      message: responseMessage,
      ready_to_execute: readyToExecute,
      data: {
        driver_id,
        vehicle_id,
        station_id: parseInt(station_id),
        battery_type_id: parseInt(vehicleBatteryTypeId),
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
    };

    return res.status(responseStatus).json(responseData);
  } catch (error) {
    console.error('❌ Error in validateAndPrepareSwap:', error);
    return res.status(500).json({
      success: false,
      message: 'Error while validating and preparing battery swap',
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

    // Bước 1: Validate tất cả pin trong batteriesIn
    console.log('\n🔍 Step 1: Validating batteries IN...');
    const validation = await swapBatteryService.validateBatteryInsertion(batteriesIn, station_id, vehicle_id);
    
    // Kiểm tra có pin không hợp lệ không
    const invalidBatteries = validation.results.filter(r => !r.valid);
    if (invalidBatteries.length > 0) {
      await transaction.rollback();
      console.log(`❌ Found ${invalidBatteries.length} invalid batteries`);
      return res.status(400).json({
        success: false,
        message: 'There are invalid batteries in the list of batteries inserted',
        data: {
          invalid_batteries: invalidBatteries.map(b => ({
            battery_id: b.battery_id,
            slot_id: b.slot_id,
            error: b.error
          }))
        }
      });
    }

    console.log(`✅ All ${batteriesIn.length} batteries are valid and belong to vehicle ${vehicle_id}`);
    
    // Bước 2: Lấy battery_type_id của vehicle
    console.log('\n🔍 Step 2: Getting battery type of vehicle...');
    const vehicle = await vehicleService.findVehicleWithModel(vehicle_id);

    if (!vehicle || !vehicle.model) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Vehicle or vehicle battery type not found'
      });
    }
    const driverId = vehicle.driver_id;
    const vehicleBatteryTypeId = vehicle.model.battery_type_id;
    console.log(`✅ Vehicle battery type: ${vehicleBatteryTypeId} (${vehicle.model.batteryType?.type_name})`);
    console.log(`driverId: ${driverId}`);
    
    // Bước 3: Tự động lấy pin mới từ DB
    console.log('\n📤 Step 3: Finding available batteries to swap OUT...');
    
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
        message: `Not enough batteries are available for swap. Required: ${requiredQuantity}, Available: ${availableSlots.length} (SOC >= 90%)`,
        data: {
          required: requiredQuantity,
          available: availableSlots.length
        }
      });
    }

    console.log(`✅ Found ${availableSlots.length} available batteries (SOC >= 90%)`);

    // Bước 4: Xử lý pin mới lấy ra
    console.log('\n📤 Step 4: Processing batteries OUT (new batteries from DB)...');
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

    // Bước 5: Xử lý pin cũ đưa vào
    console.log('\n📥 Step 5: Processing batteries IN (old batteries)...');
    for (const batteryIn of batteriesIn) {
      const { slot_id, battery_id } = batteryIn;

      const battery = await db.Battery.findByPk(battery_id, { transaction });
      if (!battery) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Battery ${battery_id} does not exist`
        });
      }

      const soh_in = battery.current_soh;
      const newSlotStatus = soh_in < sohMaintenanceThreshole ? 'locked' : 'occupied';

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

    // Bước 6: Tạo swap records và tính soh_usage đồng thời
    console.log('\n📝 Step 6: Creating swap records and calculating soh_usage...');
    const swapRecords = [];

    for (let i = 0; i < batteriesIn.length; i++) {
      const batteryIn = batteriesIn[i];
      const batteryOut = batteriesOut[i];

      const batteryInData = await db.Battery.findByPk(batteryIn.battery_id, { transaction });
      const batteryOutData = await db.Battery.findByPk(batteryOut.battery_id, { transaction });

      // Tạo swap record
      const swapRecord = await swapBatteryService.createSwapRecord({
        driver_id : driverId,
        vehicle_id,
        station_id,
        battery_id_in: batteryIn.battery_id,
        battery_id_out: batteryOut.battery_id,
        soh_in: batteryInData.current_soh,
        soh_out: batteryOutData.current_soh,
        transaction
      });

      swapRecords.push(swapRecord);
      console.log(`  ✅ Swap record created: ${swapRecord.swap_id}`);

      
    }

    // Bước 7: Update subscription.soh_usage và swap_count
    console.log('\n📊 Step 7: Updating subscription soh_usage and swap_count...');
    
    const subscription = await db.Subscription.findOne({
      where: {
        vehicle_id: vehicle_id,
        status: 'active',
        start_date: { [db.Sequelize.Op.lte]: new Date() },
        end_date: { [db.Sequelize.Op.gte]: new Date() }
      },
      transaction
    });

    if (!subscription) {
      console.log(`  ⚠️ No active subscription found for vehicle ${vehicle_id}`);
    } else {
      const newSwapCount = subscription.swap_count + swapRecords.length;

      await db.Subscription.update(
        { 
          swap_count: newSwapCount 
        },
        {
          where: { subscription_id: subscription.subscription_id },
          transaction
        }
      );

      console.log(`  ✅ Subscription updated:`);
      console.log(`     - swap_count: ${subscription.swap_count} → ${newSwapCount} (+${swapRecords.length})`);
    }

    await transaction.commit();    console.log('\n✅ ========== SWAP COMPLETED SUCCESSFULLY ==========\n');

    return res.status(200).json({
      success: true,
      message: 'Battery swap executed successfully',
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
      message: 'Error while executing battery swap',
      error: error.message
    });
  }
}

/**
 * API: Validate booking và swap 1-1 với booking_id
 * POST /api/swap/validate-with-booking
 * Body:
 * {
 *   "booking_id": "uuid",
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1,
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
        message: 'booking_id is required'
      });
    }

    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id is required'
      });
    }

    if (!station_id) {
      return res.status(400).json({
        success: false,
        message: 'station_id is required'
      });
    }

    // Kiểm tra batteriesIn là bắt buộc (đổi pin 1-1)
    if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'batteriesIn is required (must have old batteries to swap)'
      });
    }

    console.log(`\n🔍 ========== VALIDATING SWAP WITH BOOKING ==========`);
    console.log(`Booking ID: ${booking_id}`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);

    // Bước 1: Kiểm tra xe có subscription hợp lệ không
    console.log('\n🔍 Step 1: Checking vehicle subscription...');
    const subscription = await db.Subscription.findOne({
      where: {
        vehicle_id: vehicle_id,
        status: 'active',
        cancel_time: null,
        start_date: { [db.Sequelize.Op.lte]: new Date() },
        end_date: { [db.Sequelize.Op.gte]: new Date() }
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
      console.log(`❌ Vehicle does not have an active subscription`);
      return res.status(400).json({
        success: false,
        message: 'Vehicle does not have an active subscription. Please subscribe to a service plan first.'
      });
    }
    console.log(`✅ Vehicle has active subscription: ${subscription.plan.plan_name}`);

    // Bước 2: Validate booking có hợp lệ không
    console.log('\n🔍 Step 2: Validating booking...');
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
        message: 'No valid booking found with the given vehicle_id and station_id, or the booking is no longer in pending status'
      });
    }

    // Kiểm tra booking có còn trong khoảng thời gian hợp lệ không
    const now = new Date();
    const createTime = new Date(booking.create_time);
    const expired_time = new Date(booking.expired_time);

    console.log(`   - Create time: ${createTime.toISOString()}`);
    console.log(`   - Expired time: ${expired_time.toISOString()}`);
    console.log(`   - Current time: ${now.toISOString()}`);

    if (now < createTime || now > expired_time) {
      return res.status(400).json({
        success: false,
        message: 'Booking is no longer within the valid time range. The battery swap time must be between the booking creation time and the scheduled expiration time.',
        data: {
          create_time: createTime,
          expired_time: expired_time,
          current_time: now
        }
      });
    }

    console.log(`✅ Booking is valid (within the allowed time range)`);

    // Bước 3: Lấy danh sách pin đã đặt từ BookingBatteries và thông tin slot
    console.log('\n🔍 Step 3: Getting booked batteries from BookingBatteries...');
    const bookedBatteriesRaw = booking.bookingBatteries || [];
    
    if (bookedBatteriesRaw.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Booking does not have any booked batteries'
      });
    }
    
    console.log(`   - Found ${bookedBatteriesRaw.length} booked batteries`);
    
    // Lấy thông tin slot cho từng battery
    const bookedBatteries = [];
    for (const bb of bookedBatteriesRaw) {
      const battery = bb.battery;
      
      // Battery có slot_id, lấy thông tin slot từ slot_id của battery
      if (!battery.slot_id) {
        return res.status(400).json({
          success: false,
          message: `Battery ${battery.battery_id} does not have a slot_id (not assigned to a slot)`,
          data: {
            battery_id: battery.battery_id
          }
        });
      }

      // Lấy thông tin slot từ slot_id
      const slot = await db.CabinetSlot.findByPk(battery.slot_id, {
        attributes: ['slot_id', 'slot_number', 'status','cabinet_id'],
        include: [{
          model: db.Cabinet,
          as: 'cabinet',
          attributes: ['cabinet_id', 'station_id']
        }]
      });

      if (!slot) {
        return res.status(400).json({
          success: false,
          message: `Cannot find slot ${battery.slot_id} for battery ${battery.battery_id} at cabinet ${slot.cabinet_id}`,
          data: {
            battery_id: battery.battery_id,
            slot_id: battery.slot_id
          }
        });
      }

      // Kiểm tra slot status có sẵn sàng không
      if (!['booked'].includes(slot.status)) {
        return res.status(400).json({
          success: false,
          message: `Battery ${battery.battery_serial} at slot ${slot.slot_number} is not in a ready state (current status: ${slot.status})`,
          data: {
            battery_id: battery.battery_id,
            battery_serial: battery.battery_serial,
            slot_id: slot.slot_id,
            slot_status: slot.status,
            expected_statuses: ['booked']
          }
        });
      }

      bookedBatteries.push({
        battery_id: battery.battery_id,
        battery_serial: battery.battery_serial,
        current_soc: battery.current_soc,
        current_soh: battery.current_soh,
        slot_id: slot.slot_id,
        slot_number: slot.slot_number,
        slot_status: slot.status
      });

      console.log(`   - Battery ${battery.battery_id}: SOC=${battery.current_soc}%, SOH=${battery.current_soh}% at Slot ${slot.slot_id} (${slot.status})`);
    }

    // Bước 4: Kiểm tra số lượng pin đưa vào phải khớp với số lượng pin đã book
    console.log('\n🔍 Step 4: Validating batteries IN count...');
    if (batteriesIn.length !== bookedBatteries.length) {
      return res.status(400).json({
        success: false,
        message: `The number of batteries in (${batteriesIn.length}) does not match the number of booked batteries (${bookedBatteries.length})`,
        data: {
          batteries_in_count: batteriesIn.length,
          booked_batteries_count: bookedBatteries.length
        }
      });
    }

    // Bước 5: Validate batteriesIn
    console.log('\n🔍 Step 5: Validating batteries IN...');
    const validation = await swapBatteryService.validateBatteryInsertion(batteriesIn, station_id, vehicle_id);
    const validBatteries = validation.results.filter(r => r.valid);
    const invalidBatteries = validation.results.filter(r => !r.valid);

    console.log(`✅ Valid batteries: ${validBatteries.length}/${batteriesIn.length}`);
    if (invalidBatteries.length > 0) {
      console.log(`❌ Invalid batteries: ${invalidBatteries.length}`);
      invalidBatteries.forEach(b => {
        console.log(`   - Battery ${b.battery_id}: ${b.error}`);
      });
      
      return res.status(400).json({
        success: false,
        message: 'There are invalid batteries in the list of batteries being inserted',
        data: {
          invalid_batteries: invalidBatteries.map(b => ({
            battery_id: b.battery_id,
            slot_id: b.slot_id,
            error: b.error
          }))
        }
      });
    }

    console.log('\n✅ Tất cả kiểm tra đều hợp lệ. Sẵn sàng để xử lý với booking.');
    console.log('✅ ========== VALIDATION WITH BOOKING COMPLETE ==========\n');

    // Trả về kết quả validation
    return res.status(200).json({
      success: true,
      message: 'Validation successful. Ready to execute battery swap with booking.',
      ready_to_execute: true,
      data: {
        booking_id,
        driver_id: booking.driver_id,
        vehicle_id,
        station_id: parseInt(station_id),
        validation_summary: {
          has_active_subscription: true,
          total_batteries_in: batteriesIn.length,
          valid_batteries: validBatteries.length,
          booked_batteries_out: bookedBatteries.length
        },
        valid_batteries_in: validBatteries.map(v => ({
          slot_id: v.slot_id,
          battery_id: v.battery_id,
          battery_soh: v.battery_soh,
          battery_soc: v.battery_soc,
          new_slot_status: v.new_slot_status
        })),
        booked_batteries_out: bookedBatteries.map(bb => ({
          slot_id : bb.slot_id,
          slot_status: bb.slot_status,
          battery_id: bb.battery_id,
          current_soc: bb.current_soc,
          current_soh: bb.current_soh,
          battery_serial: bb.battery_serial
        })),
        booking_info: {
          booking_id: booking.booking_id,
          status: booking.status,
          create_time: booking.create_time,
          expired_time: booking.expired_time
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in validateAndPrepareSwapWithBooking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error while validating battery swap with booking',
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
    const vehicle = await vehicleService.findVehicleWithModel(vehicle_id);

    if (!vehicle || !vehicle.model) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cannot find vehicle information or vehicle battery type'
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
          message: `Battery ${battery_id} does not exist`
        });
      }

      const soh_in = battery.current_soh;
      const newSlotStatus = soh_in < sohMaintenanceThreshole ? 'locked' : 'occupied';

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
      const battery = await db.Battery.findByPk(battery_id, {
  attributes: ['battery_id', 'slot_id', 'current_soh', 'current_soc'],
  transaction
});

if (!battery || !battery.slot_id) {
  await transaction.rollback();
  return res.status(404).json({
    success: false,
    message: `Battery ${battery_id} does not have a slot_id (not yet assigned to a slot)`
  });
}

      const slot_id = battery.slot_id;
      const soh_out = battery.current_soh;
      const soc_out = battery.current_soc;

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

    // Bước 3: Tạo swap records và tính soh_usage
    console.log('\n📝 Step 3: Creating swap records and calculating soh_usage...');
    const swapRecords = [];
    for (let i = 0; i < batteriesIn.length; i++) {
      const batteryIn = batteriesIn[i];
      const batteryOut = processedBatteriesOut[i];

      const batteryInData = await db.Battery.findByPk(batteryIn.battery_id, { transaction });
      const batteryOutData = await db.Battery.findByPk(batteryOut.battery_id, { transaction });

      // Tạo swap record (với booking_id)
      const swapRecord = await swapBatteryService.createSwapRecord({
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

    }

    // Bước 4: Update subscription.soh_usage và swap_count
    console.log('\n📊 Step 4: Updating subscription soh_usage and swap_count...');
    
    const subscription = await db.Subscription.findOne({
      where: {
        vehicle_id: vehicle_id,
        status: 'active',
        start_date: { [db.Sequelize.Op.lte]: new Date() },
        end_date: { [db.Sequelize.Op.gte]: new Date() }
      },
      transaction
    });

    if (subscription) {
      const newSwapCount = subscription.swap_count + swapRecords.length;

      await db.Subscription.update(
        { 
          swap_count: newSwapCount
        },
        {
          where: { subscription_id: subscription.subscription_id },
          transaction
        }
      );

      console.log(`  ✅ Subscription updated:`);
      console.log(`     - swap_count: ${subscription.swap_count} → ${newSwapCount} (+${swapRecords.length})`);
    } else {
      console.log(`  ⚠️ No active subscription found for vehicle ${vehicle_id}`);
    }

    // Bước 5: Update booking status thành 'completed'
    console.log('\n✅ Step 5: Updating booking status to completed...');
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
      message: 'Battery swap successful with booking',
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
      message: 'Error while executing battery swap with booking',
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
      message: 'vehicle_id is required'
    });
  }

  if (!station_id) {
    return res.status(400).json({
      success: false,
      message: 'station_id is required'
    });
  }

  if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'batteriesIn must be a non-empty array'
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
      message: 'booking_id, vehicle_id, station_id are required'
    });
  }

  if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'batteriesIn must be a non-empty array'
    });
  }

  if (!batteriesOut || !Array.isArray(batteriesOut) || batteriesOut.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'batteriesOut must be a non-empty array'
    });
  }

  if (batteriesIn.length !== batteriesOut.length) {
    return res.status(400).json({
      success: false,
      message: 'The number of batteriesIn must be equal to batteriesOut'
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
 * API: Lấy danh sách pin sẵn sàng để đổi
 * GET /api/swap/available-batteries
 */
async function getAvailableBatteries(req, res) {
  try {
    const { station_id, battery_type_id, quantity } = req.query;

    if (!station_id || !battery_type_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'station_id, battery_type_id, quantity are required'
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
      message: 'Error while fetching available batteries',
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
        message: 'station_id is required'
      });
    }

    console.log(`\n🔍 Getting empty slots for station: ${station_id}`);

    const emptySlots = await swapBatteryService.getEmptySlots(parseInt(station_id));

    console.log(`✅ Found ${emptySlots.length} empty slots at station ${station_id}`);

    return res.status(200).json({
      success: true,
      message: 'Successfully retrieved empty slots list',
      data: {
        station_id: parseInt(station_id),
        total_empty_slots: emptySlots.length,
        empty_slots: emptySlots.map(slot => ({
          slot_id: slot.slot_id,
          slot_number: slot.slot_number,
          slot_status: slot.status,
          cabinet_id: slot.cabinet_id,
          battery_id: slot.battery_id
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error in getEmptySlots:', error);
    return res.status(500).json({
      success: false,
      message: 'Error while fetching empty slots',
      error: error.message
    });
  }
}



module.exports = {
  validateAndPrepareSwap, // API 4: Validate và chuẩn bị đổi pin (không có booking)
  validateAndPrepareSwapWithBooking, // API 4b: Validate và chuẩn bị đổi pin với booking
  executeSwap, // API 5: Thực hiện đổi pin (không có booking)
  executeSwapWithBooking, // API 5b: Thực hiện đổi pin với booking
  getAvailableBatteries, // Lấy danh sách pin sẵn sàng để đổi
  getEmptySlots // Lấy danh sách slot trống tại station
};