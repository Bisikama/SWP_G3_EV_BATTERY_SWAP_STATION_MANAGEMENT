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
    const statuses = ['empty', 'charging', 'charged', 'faulty'];
    
    cabinets.forEach(cabinet => {
      for (let i = 1; i <= cabinet.battery_capacity; i++) {
        const statusIndex = Math.floor(Math.random() * 100);
        let status;
        // Tăng tỷ lệ 'charged' để có nhiều pin available hơn
        if (statusIndex < 10) status = 'empty';        // 10% empty
        else if (statusIndex < 25) status = 'charging'; // 15% charging
        else if (statusIndex < 98) status = 'charged';  // 73% charged (tăng từ 55%)
        else status = 'faulty';                         // 2% faulty

        slots.push({
          slot_id: slots.length + 1,
          cabinet_id: cabinet.cabinet_id,
          slot_number: `S${String(i).padStart(2, '0')}`,
          voltage: 400.00 + (Math.random() * 10 - 5), // 395-405V
          current: 150.00 + (Math.random() * 20 - 10), // 140-160A
          status: status
        });
      }
    });

  await db.CabinetSlot.bulkCreate(slots, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CabinetSlots', null, {});
  }
};
