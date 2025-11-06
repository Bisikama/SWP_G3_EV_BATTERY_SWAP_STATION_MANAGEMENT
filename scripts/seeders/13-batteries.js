// seeders/13-batteries.js
'use strict';
const db = require('../../src/models');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const vehicles = await queryInterface.sequelize.query(
      `SELECT vehicle_id FROM "Vehicles"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const chargedSlots = await queryInterface.sequelize.query(
      `SELECT slot_id FROM "CabinetSlots" WHERE status = 'occupied'`,
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
      console.info('No battery types found; skipping Batteries seeder.');
      return;
    }

    // Batteries in vehicles (one per vehicle)
    vehicles.forEach((vehicle, index) => {
      batteries.push({
        battery_id: uuidv4(),
        battery_type_id: randomBatteryType(),
        vehicle_id: vehicle.vehicle_id,
        slot_id: null,
        battery_serial: `BAT-VEH-${String(index + 1).padStart(4, '0')}`,
        current_soc: 15.0 + Math.random() * 70, // 15-85%
        current_soh: 85.0 + Math.random() * 15 // 85-100%
      });
    });

    // Batteries in cabinet slots - MỖI SLOT CHỈ 1 PIN
    // Với 10 cabinets * 10 slots = 100 slots, 70% occupied = 70 slots có pin
    chargedSlots.forEach((slot, index) => {
      batteries.push({
        battery_id: uuidv4(),
        battery_type_id: randomBatteryType(),
        vehicle_id: null,
        slot_id: slot.slot_id,
        battery_serial: `BAT-SLOT-${String(index + 1).padStart(4, '0')}`,
        current_soc: 80.0 + Math.random() * 20, // 80-100% (fully charged)
        current_soh: 88.0 + Math.random() * 12 // 88-100% (good health)
      });
    });

    await queryInterface.bulkInsert('Batteries', batteries, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Batteries', null, {});
  }
};
