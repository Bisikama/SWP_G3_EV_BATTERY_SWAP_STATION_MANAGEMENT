// seeders/15-bookings.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT v.vehicle_id, v.driver_id 
       FROM "Vehicles" v`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (drivers.length === 0 || stations.length === 0) {
      console.log('No drivers or stations found, skipping bookings seeder');
      return;
    }

    const bookings = [];
    const now = new Date();

    // Tạo 200 bookings trong 90 ngày qua với các trạng thái khác nhau
    for (let i = 0; i < 200; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const bookingDate = new Date(now);
      bookingDate.setDate(bookingDate.getDate() - daysAgo);
      
      // Giờ cao điểm booking: 6-8h sáng (chuẩn bị đi làm), 16-18h chiều (về nhà)
      const rand = Math.random();
      let hour;
      if (rand < 0.35) {
        hour = 6 + Math.floor(Math.random() * 3); // 6-8h
      } else if (rand < 0.7) {
        hour = 16 + Math.floor(Math.random() * 3); // 16-18h
      } else {
        hour = Math.floor(Math.random() * 24);
      }
      
      bookingDate.setHours(hour, Math.floor(Math.random() * 60), 0);
      
      // Expired time: 1-2 giờ sau create_time
      const expiredTime = new Date(bookingDate.getTime() + (1 + Math.random()) * 60 * 60 * 1000);
      
      // Phân bổ trạng thái: 70% completed, 20% pending, 10% cancelled
      let status;
      const statusRand = Math.random();
      if (statusRand < 0.7) {
        status = 'completed';
      } else if (statusRand < 0.9) {
        status = 'pending';
      } else {
        status = 'cancelled';
      }

      // RANDOM driver và station thay vì sequential
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
      const randomStation = stations[Math.floor(Math.random() * stations.length)];

      bookings.push({
        booking_id: uuidv4(),
        driver_id: randomDriver.driver_id,
        vehicle_id: randomDriver.vehicle_id,
        station_id: randomStation.station_id,
        create_time: bookingDate,
        expired_time: expiredTime,
        status: status
      });
    }

    // Sắp xếp theo thời gian
    bookings.sort((a, b) => a.create_time - b.create_time);

    await queryInterface.bulkInsert('Bookings', bookings, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bookings', null, {});
  }
};
