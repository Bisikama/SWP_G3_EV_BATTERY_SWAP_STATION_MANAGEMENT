// seeders/11-cabinets.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const cabinets = [];
    
    // Station 1: 3 cabinets
    for (let i = 1; i <= 3; i++) {
      cabinets.push({
        cabinet_id: cabinets.length + 1,
        station_id: 1,
        cabinet_name: `Cabinet A${i}`,
        capacity: 10,
        power_capacity_kw: 150.00,
        status: 'operational'
      });
    }

    // Station 2: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        cabinet_id: cabinets.length + 1,
        station_id: 2,
        cabinet_name: `Cabinet B${i}`,
        capacity: 8,
        power_capacity_kw: 120.00,
        status: 'operational'
      });
    }

    // Station 3: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        cabinet_id: cabinets.length + 1,
        station_id: 3,
        cabinet_name: `Cabinet C${i}`,
        capacity: 12,
        power_capacity_kw: 180.00,
        status: 'operational'
      });
    }

    // Station 4: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        cabinet_id: cabinets.length + 1,
        station_id: 4,
        cabinet_name: `Cabinet D${i}`,
        capacity: 10,
        power_capacity_kw: 150.00,
        status: 'operational'
      });
    }

    // Station 5: 1 cabinet (maintenance)
    cabinets.push({
      cabinet_id: cabinets.length + 1,
      station_id: 5,
      cabinet_name: `Cabinet E1`,
      capacity: 8,
      power_capacity_kw: 120.00,
      status: 'maintenance'
    });

    await queryInterface.bulkInsert('Cabinets', cabinets);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Cabinets', null, {});
  }
};
