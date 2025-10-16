// seeders/18-returned-swap-batteries.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const swaps = await queryInterface.sequelize.query(
      `SELECT swap_id FROM "SwapRecords"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const vehicleBatteries = await queryInterface.sequelize.query(
      `SELECT battery_id FROM "Batteries" WHERE vehicle_id IS NOT NULL LIMIT 20`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const returnedBatteries = swaps.map((swap, index) => ({
      swap_id: swap.swap_id,
      battery_id: vehicleBatteries[index % vehicleBatteries.length].battery_id,
      soc: 5.00 + Math.random() * 20, // 5-25% (depleted)
      soh: 85.00 + Math.random() * 15, // 85-100%
      swap_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    }));

  await db.ReturnedSwapBattery.bulkCreate(returnedBatteries, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ReturnedSwapBatteries', null, {});
  }
};
