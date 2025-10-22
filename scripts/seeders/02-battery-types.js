// seeders/02-battery-types.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
  await db.BatteryType.bulkCreate([
      {
        battery_type_code: 'NMC-75',
        nominal_capacity: 75.00,
        nominal_voltage: 400.00,
        min_voltage: 300.00,
        max_voltage: 420.00,
        rated_charge_current: 150.00,
        max_charge_current: 200.00,
        cell_chemistry: 'Li-ion'
      },
      {
        battery_type_code: 'LFP-60',
        nominal_capacity: 60.00,
        nominal_voltage: 355.00,
        min_voltage: 280.00,
        max_voltage: 400.00,
        rated_charge_current: 120.00,
        max_charge_current: 160.00,
        cell_chemistry: 'LFP'
      },
      {
        battery_type_code: 'NMC-50',
        nominal_capacity: 50.00,
        nominal_voltage: 360.00,
        min_voltage: 280.00,
        max_voltage: 410.00,
        rated_charge_current: 100.00,
        max_charge_current: 140.00,
        cell_chemistry: 'Li-ion'
      },
      {
        battery_type_code: 'LFP-40',
        nominal_capacity: 40.00,
        nominal_voltage: 320.00,
        min_voltage: 260.00,
        max_voltage: 380.00,
        rated_charge_current: 80.00,
        max_charge_current: 120.00,
        cell_chemistry: 'LFP'
      }
  ], { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BatteryTypes', null, {});
  }
};
