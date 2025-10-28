const db = require('../models');
const math = require('../utils/chargingMath')

async function autoCharge(durationHours) {
	try {
		const batterySpecs = await db.Battery.findAll({
			include: [
				{ model: db.BatteryType, as: 'batteryType' },
				{ model: db.CabinetSlot, as: 'slot',
					include: [
						{ model: db.Cabinet, as: 'cabinet' }
					]
				}
			],
			where: {
				status: { [db.Sequelize.Op.ne]: 'empty' }
			}
		});

		for (const spec of batterySpecs) {
			const slotPower = math.calculateCabinetSlotPower(spec.slot.cabinet.power_capacity_kw*1000,spec.slot.cabinet.battery_capacity);
			const slotChargeCurrent = math.calculateCabinetSlotChargeCurrent(slotPower,spec.batteryType.nominalVoltage);
			const icc = math.calculateICCCurrent(slotChargeCurrent,spec.batteryType.rated_charge_current);

			spec.current_soc = math.estimateSOCTarget(spec.current_soc, spec.batteryType.nominal_capacity, icc, durationHours);
		}
	} catch (error) {
		
	}
}

module.exports = {
	autoCharge
};