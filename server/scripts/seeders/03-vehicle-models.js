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
        battery_type_id: byCode['NMC-75'],
        name: 'Model 3',
        brand: 'Tesla',
        avg_energy_usage: 15.50
      },
      {
        battery_type_id: byCode['LFP-60'],
        name: 'Model Y',
        brand: 'Tesla',
        avg_energy_usage: 17.20
      },
      {
        battery_type_id: byCode['NMC-50'],
        name: 'Leaf',
        brand: 'Nissan',
        avg_energy_usage: 16.80
      },
      {
        battery_type_id: byCode['LFP-60'],
        name: 'ID.4',
        brand: 'Volkswagen',
        avg_energy_usage: 18.00
      },
      {
        battery_type_id: byCode['LFP-40'],
        name: 'e-Golf',
        brand: 'Volkswagen',
        avg_energy_usage: 14.50
      },
      {
        battery_type_id: byCode['NMC-75'],
        name: 'Kona Electric',
        brand: 'Hyundai',
        avg_energy_usage: 15.00
      },
      {
        battery_type_id: byCode['NMC-50'],
        name: 'VF8',
        brand: 'VinFast',
        avg_energy_usage: 16.50
      }
    ], { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('VehicleModels', null, {});
  }
};
