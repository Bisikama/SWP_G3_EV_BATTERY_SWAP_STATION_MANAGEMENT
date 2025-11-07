// seeders/12-cabinet-slots.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy thông tin cabinets theo station
    const cabinets = await queryInterface.sequelize.query(
      `SELECT c.cabinet_id, c.battery_capacity, c.station_id, s.station_name
       FROM "Cabinets" c
       JOIN "Stations" s ON c.station_id = s.station_id
       ORDER BY s.station_id, c.cabinet_id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Group cabinets by station
    const cabinetsByStation = {};
    cabinets.forEach(cabinet => {
      if (!cabinetsByStation[cabinet.station_id]) {
        cabinetsByStation[cabinet.station_id] = {
          station_name: cabinet.station_name,
          cabinets: []
        };
      }
      cabinetsByStation[cabinet.station_id].cabinets.push(cabinet);
    });

    const slots = [];

    // Xử lý từng station
    Object.keys(cabinetsByStation).forEach(stationId => {
      const stationData = cabinetsByStation[stationId];
      const stationCabinets = stationData.cabinets;
      
      // Tính tổng slots của station
      const totalSlots = stationCabinets.reduce((sum, cab) => sum + cab.battery_capacity, 0);
      
      // MỖI TRẠM CÓ TỪ 3 ĐẾN 8 SLOT TRỐNG (RANDOM)
      const MIN_EMPTY = 3;
      const MAX_EMPTY = 8;

      // Nếu tổng slot < 3 thì mặc định để trống 1 thôi để tránh lỗi
      const emptySlots = totalSlots >= MIN_EMPTY 
        ? Math.min(
            Math.floor(Math.random() * (MAX_EMPTY - MIN_EMPTY + 1)) + MIN_EMPTY,
            totalSlots // không vượt số slot thực tế
          )
        : 1;
      const occupiedSlots = totalSlots - emptySlots;
      
      console.log(`Station ${stationData.station_name}: ${totalSlots} slots total, ${emptySlots} empty, ${occupiedSlots} occupied`);
      
      // Tạo array status cho toàn bộ station
      const allStatuses = [
        ...Array(emptySlots).fill('empty'),
        ...Array(occupiedSlots).fill('occupied')
      ];
      
      // Shuffle để random vị trí
      for (let i = allStatuses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allStatuses[i], allStatuses[j]] = [allStatuses[j], allStatuses[i]];
      }
      
      // Phân phối slots cho các cabinets của station
      let statusIndex = 0;
      stationCabinets.forEach(cabinet => {
        for (let i = 1; i <= cabinet.battery_capacity; i++) {
          slots.push({
            cabinet_id: cabinet.cabinet_id,
            slot_number: `S${String(i).padStart(2, '0')}`,
            voltage: 400 + (Math.random() * 10 - 5), // 395-405V
            current: 150 + (Math.random() * 20 - 10), // 140-160A
            status: allStatuses[statusIndex]
          });
          statusIndex++;
        }
      });
    });

    await queryInterface.bulkInsert('CabinetSlots', slots, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CabinetSlots', null, {});
  }
};
