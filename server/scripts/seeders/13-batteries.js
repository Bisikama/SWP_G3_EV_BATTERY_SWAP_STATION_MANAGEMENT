// seeders/13-batteries.js
'use strict';
const { v4: uuidv4 } = require('uuid');

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

    const warehouses = await queryInterface.sequelize.query(
      `SELECT warehouse_id FROM "Warehouses"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const batteryTypes = await queryInterface.sequelize.query(
      `SELECT battery_type_id FROM "BatteryTypes"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const randomBatteryType = () =>
      batteryTypes[Math.floor(Math.random() * batteryTypes.length)].battery_type_id;

    const batteries = [];

    // Batteries in vehicles (one per vehicle)
    vehicles.forEach((vehicle, index) => {
      batteries.push({
        battery_id: uuidv4(),
        battery_type_id: randomBatteryType(),
        vehicle_id: vehicle.vehicle_id,
        warehouse_id: null,
        slot_id: null,
        battery_serial: `BAT-VEH-${String(index + 1).padStart(4, '0')}`,
        current_soc: 15.00 + Math.random() * 70, // 15-85%
        current_soh: 85.00 + Math.random() * 15 // 85-100%
      });
    });

    // Batteries in cabinet slots
    chargedSlots.slice(0, 50).forEach((slot, index) => {
      batteries.push({
        battery_id: uuidv4(),
        battery_type_id: randomBatteryType(),
        vehicle_id: null,
        warehouse_id: null,
        slot_id: slot.slot_id,
        battery_serial: `BAT-SLT-${String(index + 1).padStart(4, '0')}`,
        current_soc: 80.00 + Math.random() * 20, // 80-100%
        current_soh: 88.00 + Math.random() * 12 // 88-100%
      });
    });

    // Batteries in warehouses
    for (let i = 0; i < 30; i++) {
      batteries.push({
        battery_id: uuidv4(),
        battery_type_id: randomBatteryType(),
        vehicle_id: null,
        warehouse_id: warehouses[i % warehouses.length].warehouse_id,
        slot_id: null,
        battery_serial: `BAT-WRH-${String(i + 1).padStart(4, '0')}`,
        current_soc: 95.00 + Math.random() * 5, // 95-100%
        current_soh: 92.00 + Math.random() * 8 // 92-100%
      });
    }

    await queryInterface.bulkInsert('Batteries', batteries);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Batteries', null, {});
  }
};
