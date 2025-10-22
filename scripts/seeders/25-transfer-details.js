// seeders/25-transfer-details.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const requests = await queryInterface.sequelize.query(
      `SELECT transfer_request_id, station_id FROM "TransferRequests" ORDER BY request_time LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!requests.length) return;

    // For each request create a detail pointing from a source station (different from destination)
    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const details = [];
    for (let i = 0; i < requests.length; i++) {
      // pick a source station different from destination
      const dest = requests[i].destination_station_id;
      const source = stations.find(s => s.station_id !== dest) || stations[0];

      details.push({
        transfer_request_id: requests[i].transfer_request_id,
        station_id: source.station_id,
        staff_id: null,
        confirm_time: null,
        transfer_quantity: 3,
        status: 'transfering'
      });
    }

    await db.TransferDetail.bulkCreate(details, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TransferDetails', null, {});
  }
};
