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
    const now = new Date();

    // Tạo bookings với các trạng thái khác nhau để test
    drivers.forEach((driver, index) => {
      // Booking 1: Pending - scheduled trong tương lai (2 giờ sau)
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      bookings.push({
        booking_id: uuidv4(),
        driver_id: driver.driver_id,
        vehicle_id: driver.vehicle_id,
        station_id: stations[0].station_id,
        create_time: now,
        scheduled_time: futureTime,
        status: 'pending'
      });

      // Booking 2: Completed - đã hoàn thành trong quá khứ
      const pastTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 ngày trước
      bookings.push({
        booking_id: uuidv4(),
        driver_id: driver.driver_id,
        vehicle_id: driver.vehicle_id,
        station_id: stations[1].station_id,
        create_time: new Date(pastTime.getTime() - 1 * 60 * 60 * 1000),
        scheduled_time: pastTime,
        status: 'completed'
      });

      // Booking 3: Cancelled - đã hủy
      const cancelledTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 giờ trước
      bookings.push({
        booking_id: uuidv4(),
        driver_id: driver.driver_id,
        vehicle_id: driver.vehicle_id,
        station_id: stations[2].station_id,
        create_time: new Date(cancelledTime.getTime() - 30 * 60 * 1000),
        scheduled_time: cancelledTime,
        status: 'cancelled'
      });
    });

    await queryInterface.bulkInsert('Bookings', bookings, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bookings', null, {});
  }
};
