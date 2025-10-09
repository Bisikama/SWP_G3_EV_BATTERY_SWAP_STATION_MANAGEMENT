// seeders/15-bookings.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT v.vehicle_id, v.driver_id 
       FROM "Vehicles" v
       LIMIT 5`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational' LIMIT 3`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const bookings = [];
    const today = new Date();

    // Create bookings for next 3 days
    drivers.forEach((driver, index) => {
      for (let day = 0; day < 3; day++) {
        const bookingDate = new Date(today);
        bookingDate.setDate(today.getDate() + day);
        bookingDate.setHours(9 + (index * 2), 0, 0, 0); // Stagger times

        bookings.push({
          booking_id: uuidv4(),
          driver_id: driver.driver_id,
          vehicle_id: driver.vehicle_id,
          station_id: stations[day % stations.length].station_id,
          booking_time: new Date(),
          scheduled_start_time: bookingDate,
          scheduled_end_time: new Date(bookingDate.getTime() + 15 * 60000) // 15 minutes later
        });
      }
    });

    await queryInterface.bulkInsert('Bookings', bookings);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bookings', null, {});
  }
};
