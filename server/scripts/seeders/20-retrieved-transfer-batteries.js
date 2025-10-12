// seeders/20-retrieved-transfer-batteries.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transfers = await queryInterface.sequelize.query(
      `SELECT transfer_id FROM "TransferRecords" WHERE status IN ('accepted', 'confirmed')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const warehouseBatteries = await queryInterface.sequelize.query(
      `SELECT battery_id FROM "Batteries" WHERE warehouse_id IS NOT NULL`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const retrievedTransferBatteries = [];

    transfers.forEach((transfer, index) => {
      // Each transfer moves 3-5 batteries
      const batteryCount = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < batteryCount; i++) {
        const batteryIndex = (index * 5 + i) % warehouseBatteries.length;
        retrievedTransferBatteries.push({
          transfer_id: transfer.transfer_id,
          battery_id: warehouseBatteries[batteryIndex].battery_id,
          soc: 95.00 + Math.random() * 5, // 95-100%
          soh: 92.00 + Math.random() * 8, // 92-100%
          swap_time: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        });
      }
    });

    await queryInterface.bulkInsert('RetrievedTransferBatteries', retrievedTransferBatteries);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RetrievedTransferBatteries', null, {});
  }
};
