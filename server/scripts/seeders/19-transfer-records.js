// seeders/19-transfer-records.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const warehouses = await queryInterface.sequelize.query(
      `SELECT warehouse_id, manager_id FROM "Warehouses"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const staff = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'staff' LIMIT 2`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const transfers = [];
    const statuses = ['pending', 'accepted', 'rejected', 'confirmed'];

    // Create 15 transfer records
    for (let i = 0; i < 15; i++) {
      const createTime = new Date();
      createTime.setDate(createTime.getDate() - Math.floor(Math.random() * 20));

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      let acceptTime = null;
      let confirmTime = null;

      if (status === 'accepted' || status === 'confirmed') {
        acceptTime = new Date(createTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after create
      }

      if (status === 'confirmed') {
        confirmTime = new Date(acceptTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours after accept
      }

      transfers.push({
        transfer_id: uuidv4(),
        warehouse_id: warehouses[i % warehouses.length].warehouse_id,
        station_id: stations[i % stations.length].station_id,
        manager_id: warehouses[i % warehouses.length].manager_id,
        staff_id: status !== 'pending' ? staff[i % staff.length].account_id : null,
        create_time: createTime,
        accept_time: acceptTime,
        confirm_time: confirmTime,
        status: status,
        notes: status === 'rejected' ? 'Insufficient capacity at station' : null
      });
    }

    await queryInterface.bulkInsert('TransferRecords', transfers);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TransferRecords', null, {});
  }
};
