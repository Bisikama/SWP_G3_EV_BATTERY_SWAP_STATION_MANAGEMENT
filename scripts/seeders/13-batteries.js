// seeders/13-batteries.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const vehicles = await queryInterface.sequelize.query(
      `SELECT vehicle_id FROM "Vehicles"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const chargedSlots = await queryInterface.sequelize.query(
      `SELECT slot_id FROM "CabinetSlots" WHERE status IN ('charged', 'charging')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const batteryTypes = await queryInterface.sequelize.query(
      `SELECT battery_type_id FROM "BatteryTypes"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const randomBatteryType = () =>
      batteryTypes[Math.floor(Math.random() * batteryTypes.length)].battery_type_id;

    const batteries = [];

    if (!batteryTypes || batteryTypes.length === 0) {
      console.info('No battery types found; skipping Batteries seeder to avoid null battery_type_id.');
      return;
    }

    // Batteries in vehicles (one per vehicle)
    vehicles.forEach((vehicle, index) => {
      batteries.push({
        battery_type_id: randomBatteryType(),
        vehicle_id: vehicle.vehicle_id,
        slot_id: null,
        battery_serial: `BAT-VEH-${String(index + 1).padStart(4, '0')}`,
        current_soc: 15.00 + Math.random() * 70, // 15-85%
        current_soh: 70.00 + Math.random() * 30  // 70-100% (tăng từ 85)
      });
    });

    // Batteries in cabinet slots - MỖI SLOT CHỈ 1 PIN
    // Lấy đúng số lượng slots để tránh duplicate
    const availableSlots = chargedSlots.slice(0, Math.min(chargedSlots.length, 100));
    
    availableSlots.forEach((slot, index) => {
      batteries.push({
        battery_type_id: randomBatteryType(),
        vehicle_id: null,
        slot_id: slot.slot_id,
        battery_serial: `BAT-SLT-${String(index + 1).padStart(4, '0')}`,
        current_soc: 92.00 + Math.random() * 8,  // 92-100% (tăng từ 80, đảm bảo > 90%)
        current_soh: 70.00 + Math.random() * 30  // 70-100% (đảm bảo >= 70%)
      });
    });

    // LOẠI BỎ extra batteries để tránh duplicate slot_id
    // Nếu cần thêm pin, nên tạo thêm vehicles hoặc slots trước

  await db.Battery.bulkCreate(batteries, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Batteries', null, {});
  }
};
