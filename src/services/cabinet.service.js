const db = require('../models');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/paginate');
const { v4: uuidv4 } = require('uuid');

const detailData = [
	{ model: db.CabinetSlot, as: 'slots',
		attributes: ['slot_number', 'voltage', 'current'],
		include: [
			{ model: db.Battery, as: 'battery',
				attributes: ['battery_id', 'battery_serial', 'current_soc', 'current_soh']
			}
		]
	}
];

async function findAll(filters = {}, page = 1, pageSize = 10) {
	const options = {
		include: [
			{ model: db.Station, as: 'station' }
		]
	};

	return paginate(db.Cabinet, filters, { ...options, page, pageSize });
}

async function findById(id) {
	return db.Cabinet.findByPk(id, {
		include: detailData
	});
}

async function findByStation(station_id, page = 1, pageSize = 10) {
	return paginate(db.Cabinet, 
		{ station_id },
		{ include: detailData, page, pageSize }
	);
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

    const numberOfBatteries = cabinetCount === 0
      ? Math.max(battery_capacity - 3, 0)
      : battery_capacity;

    const batteryTypes = await db.BatteryType.findAll();
    if (!batteryTypes.length) {
      throw new ApiError(404, 'No supported battery types found to create new batteries');
    }

    const now = new Date();
    const todayStr = 
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');

    const batteries = [];

    for (let i = 0; i < numberOfBatteries; i++) {
      const randomType = batteryTypes[Math.floor(Math.random() * batteryTypes.length)];
			const id = uuidv4();
      const serialNumber = id.split('-')[0].toUpperCase();
      const battery_serial = `BATT${todayStr}${serialNumber}`;

      batteries.push({
				battery_id: id,
        battery_type_id: randomType.battery_type_id,
        slot_id: slots[i].slot_id,
        battery_serial,
        current_soc: 100.0,
        current_soh: 100.0
      });

      // update slot with actual voltage and status
      slots[i].voltage = randomType.max_voltage;
      slots[i].status = 'occupied';
      await slots[i].save({ transaction: t });
    }

    if (batteries.length) {
      await db.Battery.bulkCreate(batteries, { transaction: t });
    }

    await t.commit();

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

module.exports = { findAll, findById, findByStation, createCabinet, chargeFull };
