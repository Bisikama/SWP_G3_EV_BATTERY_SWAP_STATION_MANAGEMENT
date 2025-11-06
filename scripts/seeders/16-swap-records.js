// seeders/16-swap-records.js
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
      console.log('No drivers or stations found, skipping swap records seeder');
      return;
    }

    const swaps = [];
    const now = new Date();
    
    // Tạo 200 swap records phân bổ đều trong 90 ngày (3 tháng)
    // Random driver và station để phân bổ realistic hơn
    for (let i = 0; i < 200; i++) {
      // Phân bổ ngẫu nhiên trong 90 ngày qua
      const daysAgo = Math.floor(Math.random() * 90);
      const swapDate = new Date(now);
      swapDate.setDate(swapDate.getDate() - daysAgo);
      
      // Giờ cao điểm: 7-9h sáng (40%), 17-19h chiều (40%), còn lại (20%)
      const rand = Math.random();
      let hour;
      if (rand < 0.4) {
        hour = 7 + Math.floor(Math.random() * 3); // 7-9h
      } else if (rand < 0.8) {
        hour = 17 + Math.floor(Math.random() * 3); // 17-19h
      } else {
        hour = Math.floor(Math.random() * 24); // bất kỳ giờ nào
      }
      
      swapDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      // RANDOM driver và station thay vì sequential
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
      const randomStation = stations[Math.floor(Math.random() * stations.length)];

      swaps.push({
        swap_id: uuidv4(),
        driver_id: randomDriver.driver_id,
        vehicle_id: randomDriver.vehicle_id,
        station_id: randomStation.station_id,
        swap_time: swapDate
      });
    }

    // Sắp xếp theo thời gian để dễ phân tích
    swaps.sort((a, b) => a.swap_time - b.swap_time);

    await queryInterface.bulkInsert('SwapRecords', swaps, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SwapRecords', null, {});
  }
};
