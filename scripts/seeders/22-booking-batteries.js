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
      `SELECT battery_id FROM "Batteries" WHERE slot_id IS NOT NULL AND current_soc > 80`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (chargedBatteries.length === 0) {
      console.log('No charged batteries found, skipping booking batteries seeder');
      return;
    }

    // RANDOM battery cho mỗi booking thay vì sequential
    // Nhiều bookings có thể dùng chung 1 battery (realistic - battery được swap nhiều lần)
    const bookingBatteries = bookings.map((booking) => ({
      booking_id: booking.booking_id,
      battery_id: chargedBatteries[Math.floor(Math.random() * chargedBatteries.length)].battery_id
    }));

    await queryInterface.bulkInsert('BookingBatteries', bookingBatteries, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BookingBatteries', null, {});
  }
};
