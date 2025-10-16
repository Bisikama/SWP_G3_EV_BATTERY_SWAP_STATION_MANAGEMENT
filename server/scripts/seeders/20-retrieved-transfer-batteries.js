// seeders/20-retrieved-transfer-batteries.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transfers = await queryInterface.sequelize.query(
      `SELECT transfer_id FROM "Transfers" WHERE status IN ('approved', 'completed')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const unassignedBatteries = await queryInterface.sequelize.query(
      `SELECT battery_id FROM "Batteries" WHERE vehicle_id IS NULL AND slot_id IS NULL`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const retrievedTransferBatteries = [];

    transfers.forEach((transfer, index) => {
      // Each transfer moves 3-5 batteries
      const batteryCount = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < batteryCount; i++) {
        if (unassignedBatteries.length === 0) break;
        const batteryIndex = (index * 5 + i) % unassignedBatteries.length;
        retrievedTransferBatteries.push({
          transfer_id: transfer.transfer_id,
          battery_id: unassignedBatteries[batteryIndex].battery_id,
          soc: 95.00 + Math.random() * 5, // 95-100%
          soh: 92.00 + Math.random() * 8, // 92-100%
          swap_time: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        });
      }
    });

    if (retrievedTransferBatteries.length > 0) {
  await db.RetrievedTransferBattery.bulkCreate(retrievedTransferBatteries, { validate: true });
    } else {
      console.info('No RetrievedTransferBatteries to insert, skipping.');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RetrievedTransferBatteries', null, {});
  }
};
