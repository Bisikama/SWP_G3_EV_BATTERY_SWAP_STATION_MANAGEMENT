const db = require('../models');
const math = require('../utils/chargingMath');

/**
 * Simulate charging for all batteries in all slots.
 * @param {number} durationMinutes - duration of this simulation step in minutes
 */
async function autoCharge(durationMinutes) {
  try {
    console.log('\n🔄 ========== CRON JOB: Charging Simulation ==========');
    console.log(`⏰ Running at: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`📅 Simulating cabinet's charging behaviour every ${durationMinutes} minutes`);

    // Convert minutes → hours for SOC calculation
    const durationHours = durationMinutes / 60;

    // Fetch all batteries that are not empty
    const batterySpecs = await db.Battery.findAll({
      include: [
        { model: db.BatteryType, as: 'batteryType' },
        { model: db.CabinetSlot, as: 'cabinetSlot',
          include: [
            { model: db.Cabinet, as: 'cabinet' }
          ],
					where: {
						status: { [db.Sequelize.Op.notIn]: ['empty', 'locked'] }
					}
        }
      ],
			logging: false
    });

    for (const spec of batterySpecs) {
      if (!spec.cabinetSlot || !spec.cabinetSlot.cabinet) continue; // skip if no slot/cabinet

      const slotPower = math.calculateCabinetSlotPower(
        spec.cabinetSlot.cabinet.power_capacity_kw * 1000,
        spec.cabinetSlot.cabinet.battery_capacity
      );

      const slotChargeCurrent = math.calculateCabinetSlotChargeCurrent(
        slotPower,
        spec.batteryType.nominal_voltage
      );

      const icc = math.calculateICCCurrent(
        slotChargeCurrent,
        spec.batteryType.rated_charge_current
      );

      // Update SOC
			const new_soc = math.estimateSOCTarget(
        spec.current_soc,
        spec.batteryType.nominal_capacity,
        icc,
        durationHours
      );
      spec.current_soc = new_soc * 100;

      // Update slot voltage & current if slot exists
      spec.cabinetSlot.voltage = math.estimateChargingVoltage(
        new_soc,
        spec.batteryType.nominal_voltage,
        spec.batteryType.max_voltage
      );

      spec.cabinetSlot.current = math.estimateChargingCurrent(
        new_soc,
        icc
      );

      // Save both asynchronously
      await Promise.all([spec.save({logging:false}), spec.cabinetSlot.save({logging:false})]);
    }

    console.log(`✅ Charging simulation completed for ${batterySpecs.length} batteries`);
  } catch (error) {
    console.error('\n❌ ========== CRON JOB ERROR ==========');
    console.error('Error charging simulation:', error.message);
    console.error('Stack:', error.stack);
    console.error('==========================================\n');
  }
}

module.exports = {
  autoCharge
};
