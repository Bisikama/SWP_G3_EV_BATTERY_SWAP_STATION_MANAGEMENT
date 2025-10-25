const { CabinetSlot, Battery, SwapRecord, Cabinet, BatteryType } = require('../models');
const { Op } = require('sequelize');

/**
 * Service 4: Lấy danh sách các ô pin đang trống của cabinet tại trạm
 * @param {number} station_id - ID của trạm
 * @param {number} cabinet_id - ID của tủ pin (optional, nếu không có thì lấy tất cả tủ của trạm)
 * @returns {Array} - Danh sách các slot trống
 */
async function getEmptySlots(station_id, cabinet_id = null) {
  try {
    const whereClause = {
      status: 'empty'
    };

    // Build query để lấy empty slots
    const slots = await CabinetSlot.findAll({
      where: whereClause,
      include: [
        {
          model: Cabinet,
          as: 'cabinet',
          where: cabinet_id ? { cabinet_id: cabinet_id } : { station_id: station_id },
          attributes: ['cabinet_id', 'station_id']
        }
      ],
      attributes: ['slot_id', 'slot_number', 'cabinet_id', 'voltage', 'current', 'status'],
      order: [['cabinet_id', 'ASC'], ['slot_number', 'ASC']]
    });

    return slots;
  } catch (error) {
    console.error('Error in getEmptySlots:', error);
    throw error;
  }
}

/**
 * Service 4: Xác nhận pin được đưa vào các slot
 * Kiểm tra:
 * - Slot có đang empty không
 * - Battery có tồn tại không
 * - Battery có thuộc về vehicle đang đổi không
 * - SOH của battery để quyết định status của slot
 * @param {Array} slotUpdates - Mảng các object { slot_id, battery_id }
 * @param {string} vehicle_id - ID của vehicle đang đổi pin (để validate ownership)
 * @returns {Object} - Kết quả validation
 */
async function validateBatteryInsertion(slotUpdates, vehicle_id = null) {
  try {
    const results = [];
    let allValid = true;

    for (const update of slotUpdates) {
      const { slot_id, battery_id } = update;

      // Kiểm tra slot có tồn tại và đang empty không
      const slot = await CabinetSlot.findByPk(slot_id);
      if (!slot) {
        results.push({
          slot_id,
          battery_id,
          valid: false,
          error: `Slot ${slot_id} không tồn tại`
        });
        allValid = false;
        continue;
      }

      if (slot.status !== 'empty') {
        results.push({
          slot_id,
          battery_id,
          valid: false,
          error: `Slot ${slot_id} không trống (status: ${slot.status})`
        });
        allValid = false;
        continue;
      }

      // Kiểm tra battery có tồn tại không
      const battery = await Battery.findByPk(battery_id);
      if (!battery) {
        results.push({
          slot_id,
          battery_id,
          valid: false,
          error: `Battery ${battery_id} không tồn tại`
        });
        allValid = false;
        continue;
      }

      // Kiểm tra battery có thuộc về vehicle đang đổi không
      if (vehicle_id && battery.vehicle_id !== vehicle_id) {
        results.push({
          slot_id,
          battery_id,
          valid: false,
          error: `Battery ${battery_id} không thuộc về xe này (vehicle_id hiện tại: ${battery.vehicle_id || 'null'})`
        });
        allValid = false;
        continue;
      }

      // Kiểm tra SOH để xác định status của slot
      const newSlotStatus = battery.current_soh < 70 ? 'faulty' : 'charging';

      results.push({
        slot_id,
        battery_id,
        valid: true,
        battery_soh: battery.current_soh,
        battery_soc: battery.current_soc,
        new_slot_status: newSlotStatus
      });
    }

    return {
      allValid,
      results
    };
  } catch (error) {
    console.error('Error in validateBatteryInsertion:', error);
    throw error;
  }
}

/**
 * Service 5: Cập nhật slot status sau khi nhận pin
 * @param {number} slot_id - ID của slot
 * @param {string} status - Status mới ('charging' hoặc 'faulty')
 * @param {Object} transaction - Transaction (optional)
 * @returns {Object} - Slot đã cập nhật
 */
async function updateSlotStatus(slot_id, status, transaction = null) {
  try {
    const options = transaction ? { where: { slot_id: slot_id }, transaction } : { where: { slot_id: slot_id } };
    
    const [updatedRows] = await CabinetSlot.update(
      { status: status },
      options
    );

    if (updatedRows === 0) {
      throw new Error(`Không thể cập nhật slot ${slot_id}`);
    }

    const findOptions = transaction ? { transaction } : {};
    const updatedSlot = await CabinetSlot.findByPk(slot_id, findOptions);
    return updatedSlot;
  } catch (error) {
    console.error('Error in updateSlotStatus:', error);
    throw error;
  }
}

/**
 * Service 5: Cập nhật battery cũ được đưa vào slot
 * - Update slot_id của battery
 * - Set vehicle_id thành null
 * @param {string} battery_id - ID của battery
 * @param {number} slot_id - ID của slot
 * @param {Object} transaction - Transaction (optional)
 * @returns {Object} - Battery đã cập nhật
 */
async function updateOldBatteryToSlot(battery_id, slot_id, transaction = null) {
  try {
    const options = transaction ? { where: { battery_id: battery_id }, transaction } : { where: { battery_id: battery_id } };
    
    const [updatedRows] = await Battery.update(
      {
        slot_id: slot_id,
        vehicle_id: null
      },
      options
    );

    if (updatedRows === 0) {
      throw new Error(`Không thể cập nhật battery ${battery_id}`);
    }

    const findOptions = transaction ? { transaction } : {};
    const updatedBattery = await Battery.findByPk(battery_id, {
      include: [
        { model: CabinetSlot, as: 'cabinetSlot' },
        { model: BatteryType, as: 'batteryType' }
      ],
      ...findOptions
    });
    return updatedBattery;
  } catch (error) {
    console.error('Error in updateOldBatteryToSlot:', error);
    throw error;
  }
}

/**
 * Service 5: Cập nhật battery mới được lấy ra từ slot cho vehicle
 * - Set slot_id thành null
 * - Update vehicle_id
 * @param {string} battery_id - ID của battery
 * @param {string} vehicle_id - ID của vehicle
 * @param {Object} transaction - Transaction (optional)
 * @returns {Object} - Battery đã cập nhật
 */
async function updateNewBatteryToVehicle(battery_id, vehicle_id, transaction = null) {
  try {
    const options = transaction ? { where: { battery_id: battery_id }, transaction } : { where: { battery_id: battery_id } };
    
    const [updatedRows] = await Battery.update(
      {
        slot_id: null,
        vehicle_id: vehicle_id
      },
      options
    );

    if (updatedRows === 0) {
      throw new Error(`Không thể cập nhật battery ${battery_id}`);
    }

    const findOptions = transaction ? { transaction } : {};
    const updatedBattery = await Battery.findByPk(battery_id, {
      include: [
        { model: BatteryType, as: 'batteryType' }
      ],
      ...findOptions
    });
    return updatedBattery;
  } catch (error) {
    console.error('Error in updateNewBatteryToVehicle:', error);
    throw error;
  }
}

/**
 * Service 5: Lấy danh sách các slot có pin sẵn sàng để lấy
 * (status = 'charged' hoặc 'charging' với SOC >= 90%)
 * @param {number} station_id - ID của trạm
 * @param {number} battery_type_id - ID của loại pin cần lấy
 * @param {number} quantity - Số lượng pin cần lấy
 * @returns {Array} - Danh sách các slot có pin sẵn sàng
 */
async function getAvailableBatteriesForSwap(station_id, battery_type_id, quantity) {
  try {
    // Tìm các slot có pin sẵn sàng
    const slots = await CabinetSlot.findAll({
      where: {
        status: {
          [Op.in]: ['charged', 'charging']
        }
      },
      include: [
        {
          model: Cabinet,
          as: 'cabinet',
          where: { station_id: station_id },
          attributes: ['cabinet_id', 'station_id']
        },
        {
          model: Battery,
          as: 'battery',
          where: {
            battery_type_id: battery_type_id,
            current_soc: {
              [Op.gte]: 90 // SOC >= 90% mới cho đổi (đã tăng từ 80% lên 90%)
            }
          },
          include: [
            { model: BatteryType, as: 'batteryType' }
          ]
        }
      ],
      limit: quantity,
      order: [
        [{ model: Battery, as: 'battery' }, 'current_soc', 'DESC'] // Ưu tiên pin có SOC cao nhất
      ]
    });

    return slots;
  } catch (error) {
    console.error('Error in getAvailableBatteriesForSwap:', error);
    throw error;
  }
}

/**
 * Service 5: Tạo swap record
 * @param {Object} swapData - Dữ liệu swap
 * @param {Object} transaction - Transaction (optional)
 * @returns {Object} - SwapRecord đã tạo
 */
async function createSwapRecord(swapData, transaction = null) {
  try {
    const {
      driver_id,
      vehicle_id,
      station_id,
      battery_id_in,    // Pin cũ đưa vào
      battery_id_out,   // Pin mới lấy ra
      soh_in,
      soh_out
    } = swapData;

     // ✅ Validation chi tiết hơn
    console.log('🔍 Creating SwapRecord with data:', {
      driver_id,
      vehicle_id,
      station_id,
      battery_id_in,
      battery_id_out,
      soh_in,
      soh_out
    });

    if (!driver_id) {
      throw new Error('Swap record must be associated with a driver (driver_id is required)');
    }

    if (!vehicle_id) {
      throw new Error('Swap record must be associated with a vehicle (vehicle_id is required)');
    }

    if (!station_id) {
      throw new Error('Swap record must be associated with a station (station_id is required)');
    }


    const options = transaction ? { transaction } : {};

    const swapRecord = await SwapRecord.create({
      driver_id,
      vehicle_id,
      station_id,
      battery_id_in,
      battery_id_out,
      soh_in,
      soh_out,
      swap_time: new Date()
    }, options);

    

    return swapRecord;
  } catch (error) {
    console.error('Error in createSwapRecord:', error);
    throw error;
  }
}

/**
 * Service: Tạo swap record với booking_id
 * @param {Object} swapData - Dữ liệu swap (bao gồm booking_id)
 * @param {Object} transaction - Transaction (optional)
 * @returns {Object} - SwapRecord đã tạo
 */
async function createSwapRecordWithBooking(swapData, transaction = null) {
  try {
    const {
      driver_id,
      vehicle_id,
      station_id,
      battery_id_in,
      battery_id_out,
      soh_in,
      soh_out
    } = swapData;

    const options = transaction ? { transaction } : {};

    const swapRecord = await SwapRecord.create({
      driver_id,
      vehicle_id,
      station_id,
      battery_id_in,
      battery_id_out,
      soh_in,
      soh_out,
      swap_time: new Date()
    }, options);

    // Lấy thông tin đầy đủ
    const fullRecord = await SwapRecord.findByPk(swapRecord.swap_id, {
      include: [
        { model: Battery, as: 'returnedBattery', include: [{ model: BatteryType, as: 'batteryType' }] },
        { model: Battery, as: 'retrievedBattery', include: [{ model: BatteryType, as: 'batteryType' }] }
      ],
      ...options
    });

    return fullRecord;
  } catch (error) {
    console.error('Error in createSwapRecordWithBooking:', error);
    throw error;
  }
}

/**
 * Service: Lấy pin lần đầu cho xe mới
 * Kiểm tra:
 * - Vehicle có thể lấy pin lần đầu không (take_first = false)
 * - Trạm có đủ pin phù hợp với loại xe không (SOC >= 90%)
 * @param {string} driver_id - ID của tài xế
 * @param {string} vehicle_id - ID của xe
 * @param {number} station_id - ID của trạm
 * @returns {Object} - Thông tin pin và xe
 */
async function getFirstTimeBatteries( vehicle_id, station_id) {
  try {
    const { Vehicle, VehicleModel } = require('../models');

    // Lấy thông tin xe và model
    const vehicle = await Vehicle.findByPk(vehicle_id, {
      include: [
        {
          model: VehicleModel,
          as: 'model',
          include: [
            { model: BatteryType, as: 'batteryType' }
          ]
        }
      ]
    });

    if (!vehicle) {
      throw new Error(`Vehicle ${vehicle_id} không tồn tại`);
    }

    // Kiểm tra xe đã lấy pin lần đầu chưa
    if (vehicle.take_first === true) {
      throw new Error('Xe này đã lấy pin lần đầu rồi');
    }

    // Lấy thông tin loại pin và số lượng pin cần lấy
    const battery_type_id = vehicle.model.battery_type_id;
    const battery_quantity = vehicle.model.battery_slot;

    // Tìm pin sẵn sàng tại trạm (SOC >= 90%)
    const availableSlots = await getAvailableBatteriesForSwap(
      station_id,
      battery_type_id,
      battery_quantity
    );

    if (availableSlots.length < battery_quantity) {
      throw new Error(
        `Trạm không đủ pin phù hợp. Cần ${battery_quantity} pin, chỉ có ${availableSlots.length} pin sẵn sàng`
      );
    }

    return {
      vehicle,
      battery_type_id,
      battery_quantity,
      available_slots: availableSlots
    };
  } catch (error) {
    console.error('Error in getFirstTimeBatteries:', error);
    throw error;
  }
}

module.exports = {
  getEmptySlots,
  validateBatteryInsertion,
  updateSlotStatus,
  updateOldBatteryToSlot,
  updateNewBatteryToVehicle,
  getAvailableBatteriesForSwap,
  createSwapRecord,
  createSwapRecordWithBooking,  // ← THÊM MỚI
  getFirstTimeBatteries
};
