// seeders/22-booking-batteries.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const bookings = await queryInterface.sequelize.query(
      `SELECT booking_id FROM "Bookings"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const chargedBatteries = await queryInterface.sequelize.query(
      `SELECT battery_id FROM "Batteries" WHERE slot_id IS NOT NULL AND current_soc > 80 LIMIT 30`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const bookingBatteries = bookings.map((booking, index) => ({
      booking_id: booking.booking_id,
      battery_id: chargedBatteries[index % chargedBatteries.length].battery_id
    }));

    await queryInterface.bulkInsert('BookingBatteries', bookingBatteries, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BookingBatteries', null, {});
  }
};
