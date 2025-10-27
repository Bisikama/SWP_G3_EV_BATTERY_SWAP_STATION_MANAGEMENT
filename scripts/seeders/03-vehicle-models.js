'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get battery type ids from DB
    const batteryTypes = await queryInterface.sequelize.query(
      `SELECT battery_type_id, battery_type_code FROM "BatteryTypes"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byCode = batteryTypes.reduce((acc, bt) => {
      acc[bt.battery_type_code] = bt.battery_type_id;
      return acc;
    }, {});

    const vehicleModels = [
      { battery_type_id: byCode['LFP-40'], name: 'Ludo', brand: 'VinFast', avg_energy_usage: 2.10, battery_slot: 2 },
      { battery_type_id: byCode['LFP-40'], name: 'Impes', brand: 'VinFast', avg_energy_usage: 2.20, battery_slot: 2 },
      { battery_type_id: byCode['NMC-50'], name: 'Klara S', brand: 'VinFast', avg_energy_usage: 2.50, battery_slot: 2 },
      { battery_type_id: byCode['LFP-60'], name: 'Theon S', brand: 'VinFast', avg_energy_usage: 2.90, battery_slot: 1 },
      { battery_type_id: byCode['LFP-60'], name: 'Vento', brand: 'VinFast', avg_energy_usage: 2.60, battery_slot: 1 },
      { battery_type_id: byCode['LFP-60'], name: 'Theon', brand: 'VinFast', avg_energy_usage: 2.80, battery_slot: 2 },
      { battery_type_id: byCode['LFP-60'], name: 'Vento S', brand: 'VinFast', avg_energy_usage: 2.70, battery_slot: 1 },
      { battery_type_id: byCode['LFP-60'], name: 'Feliz S', brand: 'VinFast', avg_energy_usage: 2.40, battery_slot: 1 },
      { battery_type_id: byCode['LFP-40'], name: 'Evo200', brand: 'VinFast', avg_energy_usage: 2.30, battery_slot: 1 }
    ];

    await queryInterface.bulkInsert('VehicleModels', vehicleModels, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('VehicleModels', null, {});
  }
};
