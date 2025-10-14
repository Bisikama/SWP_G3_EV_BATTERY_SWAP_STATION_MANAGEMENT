// seeders/21-returned-transfer-batteries.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Transfers with status 'completed' are eligible for returned batteries
    const transfers = await queryInterface.sequelize.query(
      `SELECT transfer_id FROM "Transfers" WHERE status = 'completed'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const slotBatteries = await queryInterface.sequelize.query(
      `SELECT battery_id FROM "Batteries" WHERE slot_id IS NOT NULL LIMIT 20`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const returnedTransferBatteries = [];

    if (transfers.length === 0 || slotBatteries.length === 0) {
      console.info('No transfers or slot batteries available for ReturnedTransferBatteries seeder, skipping.');
    } else {
      transfers.forEach((transfer, index) => {
        const batteryCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < batteryCount; i++) {
          const batteryIndex = (index * 3 + i) % slotBatteries.length;
          returnedTransferBatteries.push({
            transfer_id: transfer.transfer_id,
            battery_id: slotBatteries[batteryIndex].battery_id,
            soc: 20.00 + Math.random() * 30, // 20-50% (needs charging)
            soh: 85.00 + Math.random() * 10, // 85-95%
            transfer_time: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
          });
        }
      });

      if (returnedTransferBatteries.length > 0) {
        await queryInterface.bulkInsert('ReturnedTransferBatteries', returnedTransferBatteries);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ReturnedTransferBatteries', null, {});
  }
};
