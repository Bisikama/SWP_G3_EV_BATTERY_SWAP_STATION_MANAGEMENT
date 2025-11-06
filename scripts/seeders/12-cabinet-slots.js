// seeders/12-cabinet-slots.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const cabinets = await queryInterface.sequelize.query(
      `SELECT cabinet_id, battery_capacity FROM "Cabinets"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const slots = [];

    cabinets.forEach(cabinet => {
      // Tạo array chứa status: 3 empty (30%), 7 occupied (70%)
      // Đảm bảo tối thiểu 3 slots trống cho mỗi cabinet
      const statuses = [
        'empty', 'empty', 'empty',  // Tối thiểu 3 slots trống
        'occupied', 'occupied', 'occupied', 'occupied',
        'occupied', 'occupied', 'occupied'
      ];
      
      // Shuffle array để random vị trí
      for (let i = statuses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
      }

      for (let i = 1; i <= cabinet.battery_capacity; i++) {
        slots.push({
          cabinet_id: cabinet.cabinet_id,
          slot_number: `S${String(i).padStart(2, '0')}`,
          voltage: 400 + (Math.random() * 10 - 5), // 395-405V
          current: 150 + (Math.random() * 20 - 10), // 140-160A
          status: statuses[i - 1]
        });
      }
    });

    await queryInterface.bulkInsert('CabinetSlots', slots, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CabinetSlots', null, {});
  }
};
