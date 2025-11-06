'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('BatteryTypes', [
      {
        battery_type_code: 'LFP-60',
        nominal_capacity: 60.00,
        nominal_voltage: 355.00,
        min_voltage: 280.00,
        max_voltage: 400.00,
        rated_charge_current: 120.00,
        cell_chemistry: 'LFP'
      },
      {
        battery_type_code: 'NMC-50',
        nominal_capacity: 50.00,
        nominal_voltage: 360.00,
        min_voltage: 280.00,
        max_voltage: 410.00,
        rated_charge_current: 100.00,
        cell_chemistry: 'Li-ion'
      }
    ], {});

    // Fix sequence to avoid conflicts with future inserts
    await queryInterface.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('"BatteryTypes"', 'battery_type_id'), COALESCE(MAX(battery_type_id), 0)) 
      FROM "BatteryTypes";
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BatteryTypes', null, {});
  }
};
