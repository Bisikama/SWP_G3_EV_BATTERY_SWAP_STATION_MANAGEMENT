const db = require('../models');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/paginate');
const {
  calculateCabinetSlotPower,
  calculateCabinetSlotChargeCurrent,
  calculateICCCurrent,
  estimateTotalChargeTime
} = require('../utils/chargingMath');
const ruleConfig = require('../config/route.config');

const detailData = [
	{ model: db.CabinetSlot, as: 'slots',
		attributes: ['slot_number', 'voltage', 'current', 'status'],
		include: [
			{ model: db.Battery, as: 'battery',
				attributes: ['battery_id', 'battery_serial', 'current_soc', 'current_soh'],
        include: [
          { model: db.BatteryType, as: 'batteryType',
            attributes: [
              'battery_type_id', 
              'cell_chemistry', 
              'battery_type_code'
            ]
          }
        ]
			}
		]
	}
];

async function findAll(filters = {}, page = 1, pageSize = 10) {
  const options = { include: detailData };
  const result = await paginate(db.Cabinet, filters, { ...options, page, pageSize });

  const max_soc = 100;
  const availableThreshold = ruleConfig.getConfigValue('soc_available_threshole');

  return Promise.all(result.data.map(async cabinet => {
    const c = cabinet.toJSON();

    await Promise.all(c.slots.map(async slot => {
      if (!slot.battery) return;
      const slotId = slot.cabinet_slot_id || slot.id || slot.slot_id;
      const [avail, full] = await Promise.all([
        estimateBatteryChargeTime(slotId, availableThreshold),
        estimateBatteryChargeTime(slotId, max_soc)
      ]);

      slot.battery.estimate_charge_time_until_available = avail;
      slot.battery.estimate_charge_time_until_full = full;
    }));

    return c;
  }));
}

async function findById(id) {
	const result = await db.Cabinet.findByPk(id, {
		include: detailData,
    raw: true,
    nested: true
	});

  const max_soc = 100;
  for (const slot of result.slots) {
    if (slot.battery) {
      slot.battery.estimate_charge_time_until_available = await estimateBatteryChargeTime(slot.slot_id, ruleConfig.getConfigValue('soc_available_threshole'));
      slot.battery.estimate_charge_time_until_full = await estimateBatteryChargeTime(slot.slot_id, max_soc);
    }
  }

  return result;
}

async function createCabinet(data) {
  const { station_id, battery_capacity, power_capacity_kw } = data;

  const t = await db.sequelize.transaction();

  try {
    const station = await db.Station.findByPk(station_id);
    if (!station) throw new ApiError(404, 'Station not found');

    const cabinetCount = await db.Cabinet.count({ where: { station_id } });

    const cabinet = await db.Cabinet.create({
      station_id,
      battery_capacity,
      power_capacity_kw,
      status: 'operational'
    }, { transaction: t });

    cabinet.cabinet_code = `S${station_id}-C${cabinet.cabinet_id}`;
    await cabinet.save({ transaction: t });

    const slots = await db.CabinetSlot.bulkCreate(
      Array.from({ length: battery_capacity }).map((_, index) => ({
        cabinet_id: cabinet.cabinet_id,
        slot_number: index + 1,
        current: 0,
        voltage: 0,       // init value
        status: 'empty'   // init empty
      })),
      { transaction: t, returning: true }
    );

    const allowed_empty_slot = ruleConfig.getConfigValue('allowed_empty_slot');
    const numberOfBatteries = cabinetCount === 0
      ? Math.max(battery_capacity - allowed_empty_slot, 0)
      : battery_capacity;

    const batteryTypes = await db.BatteryType.findAll();
    if (!batteryTypes.length) {
      throw new ApiError(404, 'No supported battery types found to create new batteries');
    }

    const batteries = [];

    for (let i = 0; i < numberOfBatteries; i++) {
      const randomType = batteryTypes[Math.floor(Math.random() * batteryTypes.length)];

      batteries.push({
        battery_type_id: randomType.battery_type_id,
        slot_id: slots[i].slot_id,
        current_soc: 100.0,
        current_soh: 100.0
      });

      // update slot with actual voltage and status
      slots[i].voltage = randomType.max_voltage;
      slots[i].status = 'occupied';
      await slots[i].save({ transaction: t });
    }

    if (batteries.length) {
      await db.Battery.bulkCreate(batteries, { 
        individualHooks: true, 
        transaction: t 
      });
    }

    await t.commit();

    cabinet.power_capacity_kw = Number(cabinet.power_capacity_kw);
    return {
      cabinet,
      slotsCreated: slots.length,
      batteriesCreated: batteries.length
    };

  } catch (error) {
    await t.rollback();
		console.log(error);
    throw new ApiError(500, `Create cabinet error: ${error.message}`);
  }
}

async function chargeFull(id) {
	const batteries = await db.Battery.findAll({
		include: [
			{ model: db.CabinetSlot, as: 'cabinetSlot', 
				where: { id }
			}
		]
	});

	await Promise.all(
		batteries.map(battery => {
			battery.current_soc = 100.0;
			return battery.save(); // persist the change
		})
	);

	return batteries;
}

async function estimateBatteryChargeTime(slot_id, target_SOC) {
  const slot = await db.CabinetSlot.findByPk(slot_id, {
    include: [
      { model: db.Battery, as: 'battery',
        include: { model: db.BatteryType, as: 'batteryType' }
      },
      { model: db.Cabinet, as: 'cabinet' }
    ]
  });

  if (!slot || !slot.battery || !slot.battery.batteryType || !slot.cabinet) return 1;

  const { battery, cabinet } = slot;
  const { batteryType } = battery;

  const slotPower = calculateCabinetSlotPower(
    cabinet.power_capacity_kw * 1000,
    cabinet.battery_capacity
  );
  const slotCurrent = calculateCabinetSlotChargeCurrent(slotPower, batteryType.nominal_voltage);
  const i_cc = calculateICCCurrent(slotCurrent, batteryType.rated_charge_current);

  const estHours = estimateTotalChargeTime(
    battery.current_soc / 100,
    target_SOC / 100,
    batteryType.nominal_capacity,
    i_cc
  );

  return estHours;
}

module.exports = { findAll, findById, createCabinet, chargeFull };
