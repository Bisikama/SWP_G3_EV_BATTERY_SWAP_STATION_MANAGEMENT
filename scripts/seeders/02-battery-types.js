'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('BatteryTypes', [
      {
        battery_type_code: 'NMC-50',
        nominal_capacity: 50.4,
        nominal_voltage: 51.2,
        min_voltage: 42.0,
        max_voltage: 58.8,
        rated_charge_current: 20.0,
        cell_chemistry: 'Li-ion'
      },
      {
        battery_type_code: 'LFP-60',
        nominal_capacity: 60.0,
        nominal_voltage: 48.0,
        min_voltage: 40.0,
        max_voltage: 54.6,
        rated_charge_current: 20.0,
        cell_chemistry: 'LFP'
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
