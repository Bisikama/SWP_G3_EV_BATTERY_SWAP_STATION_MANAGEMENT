// seeders/26-transfer-battery-detail.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const details = await queryInterface.sequelize.query(
      `SELECT transfer_order_id, source_station_id FROM "TransferOrders" ORDER BY transfer_order_id LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!details.length) return;

    // For each detail, pick some batteries that currently belong to the source station (slot not null)
    for (let i = 0; i < details.length; i++) {
      const source = details[i].source_station_id;
      const batteries = await queryInterface.sequelize.query(
        `SELECT battery_id FROM "Batteries" WHERE slot_id IS NOT NULL LIMIT 3`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!batteries.length) continue;

      const rows = batteries.map(b => ({
        transfer_order_id: details[i].transfer_order_id,
        battery_id: b.battery_id
      }));

      // Insert into junction table
      if (rows.length) {
        await queryInterface.bulkInsert('TransferBatteryOrders', rows, {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TransferBatteryOrders', null, {});
  }
};
