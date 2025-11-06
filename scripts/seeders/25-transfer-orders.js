'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const requests = await queryInterface.sequelize.query(
      `SELECT transfer_request_id, station_id, request_quantity 
       FROM "TransferRequests" ORDER BY request_time LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!requests.length) return;

    // Get all operational stations
    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const orders = [];

    for (let req of requests) {
      const targetStation = req.station_id;

      // Pick all source stations except target
      const sourceStations = stations.filter(s => s.station_id !== targetStation);
      if (!sourceStations.length) continue;

      // Decide how many transfer orders per request (at least 1)
      const numOrders = Math.min(sourceStations.length, req.request_quantity);
      let remainingQty = req.request_quantity;

      for (let i = 0; i < numOrders; i++) {
        // Ensure last order takes all remaining quantity
        const qty = (i === numOrders - 1) ? remainingQty : Math.floor(Math.random() * (remainingQty - (numOrders - i - 1)) + 1);

        orders.push({
          transfer_order_id: uuidv4(),
          transfer_request_id: req.transfer_request_id,
          source_station_id: sourceStations[i % sourceStations.length].station_id,
          target_station_id: targetStation,
          staff_id: null,
          confirm_time: null,
          transfer_quantity: qty,
          status: 'incompleted'
        });

        remainingQty -= qty;
      }
    }

    await queryInterface.bulkInsert('TransferOrders', orders, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TransferOrders', null, {});
  }
};
