const db = require('../models');
const math = require('../utils/chargingMath');

async function autoCharge(durationMinutes) {
  try {
    console.log('\n🔄 ========== CRON JOB: Charging Simulation ==========');
    console.log(`⏰ Running at: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`📅 Simulating cabinet charging every ${durationMinutes} minutes`);

    const durationHours = durationMinutes / 60;

    const cabinetSlots = await db.CabinetSlot.findAll({
      include: [
        { model: db.Cabinet, as: 'cabinet' },
        { model: db.Battery, as: 'battery',
          include: [
            { model: db.BatteryType, as: 'batteryType' }
          ],
        }
      ],
      logging: false
    });

    await Promise.all(
      cabinetSlots.map(async (slot) => {
        if (!slot.battery || slot.status === 'empty') {
          slot.current = 0;
          slot.voltage = 0;
          return slot.save({ logging: false });
        }

        const { battery, cabinet } = slot;
        const { batteryType } = battery;

        // Power per slot (W)
        const slotPower = math.calculateCabinetSlotPower(
          cabinet.power_capacity_kw * 1000,
          cabinet.battery_capacity
        );

        // Current if constant-current charging
        const slotChargeCurrent = math.calculateCabinetSlotChargeCurrent(
          slotPower,
          batteryType.nominal_voltage
        );

        // Limit current to battery's rated limit (ICC)
        const icc = math.calculateICCCurrent(
          slotChargeCurrent,
          batteryType.rated_charge_current
        );

        // New SOC (ratio 0–1)
        const newSocRatio = math.estimateSOCTarget(
          battery.current_soc,
          batteryType.nominal_capacity,
          icc,
          durationHours
        );

        // Save battery SOC in percentage
        battery.current_soc = newSocRatio * 100;

        // Slot voltage + current update
        slot.voltage = math.estimateChargingVoltage(
          newSocRatio,
          batteryType.nominal_voltage,
          batteryType.max_voltage
        );
        slot.current = math.estimateChargingCurrent(newSocRatio, icc);

        return Promise.all([
          battery.save({ fields: ['current_soc'], logging: false }),
          slot.save({ fields: ['voltage', 'current'], logging: false })
        ]);
      })
    );

    console.log(`✅ Charging simulation completed for ${cabinetSlots.length} slots`);
  } catch (error) {
    console.error('\n❌ ========== CRON JOB ERROR ==========');
    console.error(error);
    console.error('==========================================\n');
  }
}

module.exports = { autoCharge };