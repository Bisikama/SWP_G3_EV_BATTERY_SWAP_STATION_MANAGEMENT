const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
	return db.Cabinet.findAll();
}

async function findById(id) {
	return db.Cabinet.findByPk(id, {
		include: [
			{
				model: db.CabinetSlot,
				as: 'slots',
				include: [
					{
						model: db.Battery,
						as: 'battery'
					}
				]
			}
		]
	});
}

async function findByStation(station_id) {
	return db.Cabinet.findAll({
		include: [
			{
				model: db.CabinetSlot,
				as: 'slots',
				include: [
					{
						model: db.Battery,
						as: 'battery'
					}
				]
			}
		],
		where: {
			station_id
		}
	});
}

async function findEmptySlot(cabinet_id) {
	return db.CabinetSlot.findAll({
		include: [
			{
				model: db.Cabinet,
				as: 'cabinet',
				where: {
					cabinet_id
				}
			}
		],
		where: {
			status: 'empty'
		}
	});
}

async function chargeFull(cabinet_id) {
	const batteries = db.Battery.findAll({
		include: [
			{ model: 'CabinetSlot', as: 'slot', 
				where: {
					cabinet_id
				}
			}
		]
	});
	batteries.current_soc = 90.00;
	return batteries;
}

module.exports = { findAll, findById, findByStation, findEmptySlot, chargeFull };
