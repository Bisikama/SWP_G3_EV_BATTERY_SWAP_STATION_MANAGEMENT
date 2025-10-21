// seeders/03-vehicle-models.js
 'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Resolve battery type ids by code to avoid hardcoding primary keys
    const batteryTypes = await queryInterface.sequelize.query(
      `SELECT battery_type_id, battery_type_code FROM "BatteryTypes"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byCode = batteryTypes.reduce((acc, bt) => { acc[bt.battery_type_code] = bt.battery_type_id; return acc; }, {});

    await db.VehicleModel.bulkCreate([
      {
        battery_type_id: byCode['LFP-40'],
        name: 'Ludo',
        brand: 'VinFast',
        avg_energy_usage: 2.10
      },
      {
        battery_type_id: byCode['LFP-40'],
        name: 'Impes',
        brand: 'VinFast',
        avg_energy_usage: 2.20
      },
      {
        battery_type_id: byCode['LFP-60'],
        name: 'Klara S',
        brand: 'VinFast',
        avg_energy_usage: 2.50
      },
      {
        battery_type_id: byCode['NMC-75'],
        name: 'Theon',
        brand: 'VinFast',
        avg_energy_usage: 2.80
      },
      {
        battery_type_id: byCode['LFP-60'],
        name: 'Vento',
        brand: 'VinFast',
        avg_energy_usage: 2.60
      },
      {
        battery_type_id: byCode['NMC-75'],
        name: 'Theon S',
        brand: 'VinFast',
        avg_energy_usage: 2.90
      },
      {
        battery_type_id: byCode['LFP-60'],
        name: 'Vento S',
        brand: 'VinFast',
        avg_energy_usage: 2.70
      },
      {
        battery_type_id: byCode['LFP-60'],
        name: 'Feliz S',
        brand: 'VinFast',
        avg_energy_usage: 2.40
      },
      {
        battery_type_id: byCode['LFP-40'],
        name: 'Evo200',
        brand: 'VinFast',
        avg_energy_usage: 2.30
      }
    ], { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('VehicleModels', null, {});
  }
};
