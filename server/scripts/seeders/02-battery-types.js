// seeders/02-battery-types.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('BatteryTypes', [
      {
        battery_type_id: 1,
        battery_type_name: 'Li-ion NMC 75kWh',
        nominal_capacity: 75.00,
        nominal_voltage: 400.00,
        energy_capacity_wh: 75000.00,
        rated_power: 150.00,
        cell_chemistry: 'Li-ion',
        weight: 480.00
      },
      {
        battery_type_id: 2,
        battery_type_name: 'LFP 60kWh Standard',
        nominal_capacity: 60.00,
        nominal_voltage: 355.00,
        energy_capacity_wh: 60000.00,
        rated_power: 120.00,
        cell_chemistry: 'LFP',
        weight: 420.00
      },
      {
        battery_type_id: 3,
        battery_type_name: 'Li-ion NMC 50kWh',
        nominal_capacity: 50.00,
        nominal_voltage: 360.00,
        energy_capacity_wh: 50000.00,
        rated_power: 100.00,
        cell_chemistry: 'Li-ion',
        weight: 350.00
      },
      {
        battery_type_id: 4,
        battery_type_name: 'LFP 40kWh Compact',
        nominal_capacity: 40.00,
        nominal_voltage: 320.00,
        energy_capacity_wh: 40000.00,
        rated_power: 80.00,
        cell_chemistry: 'LFP',
        weight: 300.00
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BatteryTypes', null, {});
  }
};
