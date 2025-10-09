// seeders/16-swap-records.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT v.vehicle_id, v.driver_id 
       FROM "Vehicles" v
       LIMIT 6`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const swaps = [];

    // Create 20 swap records over the past month
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const swapDate = new Date();
      swapDate.setDate(swapDate.getDate() - daysAgo);

      swaps.push({
        swap_id: uuidv4(),
        driver_id: drivers[i % drivers.length].driver_id,
        vehicle_id: drivers[i % drivers.length].vehicle_id,
        station_id: stations[i % stations.length].station_id
      });
    }

    await queryInterface.bulkInsert('SwapRecords', swaps);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SwapRecords', null, {});
  }
};
