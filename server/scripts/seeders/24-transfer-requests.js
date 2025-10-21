// seeders/24-transfer-requests.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // pick a staff account and a destination station
    const staffRows = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'staff' LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!staffRows.length || !stations.length) return;

    const requests = [];
    for (let i = 0; i < Math.min(3, staffRows.length); i++) {
      requests.push({
        destination_station_id: stations[i % stations.length].station_id,
        admin_id: null,
        staff_id: staffRows[i].account_id,
        request_time: new Date(),
        approve_time: null,
        request_quantity: 5,
        status: 'pending',
        notes: 'Auto-generated transfer request for seeding'
      });
    }

    await db.TransferRequest.bulkCreate(requests, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TransferRequests', null, {});
  }
};
