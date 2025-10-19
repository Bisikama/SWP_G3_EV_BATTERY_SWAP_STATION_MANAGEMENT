// seeders/17-retrieved-swap-batteries.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const swaps = await queryInterface.sequelize.query(
      `SELECT swap_id FROM "SwapRecords"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const chargedBatteries = await queryInterface.sequelize.query(
      `SELECT battery_id FROM "Batteries" WHERE slot_id IS NOT NULL LIMIT 20`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const retrievedBatteries = swaps.map((swap, index) => ({
      swap_id: swap.swap_id,
      battery_id: chargedBatteries[index % chargedBatteries.length].battery_id,
      soc: 85.00 + Math.random() * 15, // 85-100%
      soh: 90.00 + Math.random() * 10, // 90-100%
      swap_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time in last 30 days
    }));

  await db.RetrievedSwapBattery.bulkCreate(retrievedBatteries, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RetrievedSwapBatteries', null, {});
  }
};
