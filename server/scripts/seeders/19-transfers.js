// seeders/19-transfer-records.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Select operational stations to use as origin/destination
    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // admin/staff accounts to populate admin_id and staff_id
    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'admin' LIMIT 2`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const staff = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'staff' LIMIT 4`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const transfers = [];
    const statuses = ['pending', 'approved', 'rejected', 'transfering', 'completed'];

    // Create 15 transfer records using stations and account ids
    for (let i = 0; i < 15; i++) {
      const createTime = new Date();
      createTime.setDate(createTime.getDate() - Math.floor(Math.random() * 20));

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      let approveTime = null;
      let completeTime = null;

      if (status !== 'pending') {
        approveTime = new Date(createTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours after create
      }

      if (status === 'completed') {
        completeTime = new Date(approveTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours after approve
      }

      transfers.push({
        transfer_id: uuidv4(),
        origin_station_id: stations[i % stations.length].station_id,
        destination_station_id: stations[(i + 1) % stations.length].station_id,
        admin_id: admins[i % admins.length] ? admins[i % admins.length].account_id : null,
        staff_id: staff[i % staff.length].account_id,
        create_time: createTime,
        approve_time: approveTime,
        complete_time: completeTime,
        status: status,
        notes: status === 'rejected' ? 'Insufficient capacity at station' : null
      });
    }

    await queryInterface.bulkInsert('Transfers', transfers);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Transfers', null, {});
  }
};
