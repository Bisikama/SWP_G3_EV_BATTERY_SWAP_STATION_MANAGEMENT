// seeders/25-transfer-details.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const requests = await queryInterface.sequelize.query(
      `SELECT transfer_request_id, station_id as destination_station_id FROM "TransferRequests" ORDER BY request_time LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!requests.length) return;

    // Get all operational stations
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
        transfer_detail_id: uuidv4(), // UUID primary key
        transfer_request_id: requests[i].transfer_request_id,
        station_id: source.station_id,
        staff_id: null,
        confirm_time: null,
        transfer_quantity: 3,
        status: 'incompleted'
      });
    }

    await queryInterface.bulkInsert('TransferDetails', details, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TransferDetails', null, {});
  }
};
