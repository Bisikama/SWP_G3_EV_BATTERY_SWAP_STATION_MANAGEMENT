const db = require('../models');
const ApiError = require('../utils/ApiError');
const paginate = require('../utils/paginate');

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

module.exports = { findAll, findById, findByStation, chargeFull };
