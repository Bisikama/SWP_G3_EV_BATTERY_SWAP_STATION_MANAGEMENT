// seeders/11-cabinets.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Resolve station ids by name to avoid hardcoding numeric IDs
    const stations = await queryInterface.sequelize.query(
      `SELECT station_id, station_name FROM "Stations"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byName = stations.reduce((acc, s) => { acc[s.station_name] = s.station_id; return acc; }, {});

    const cabinets = [];

    // Station 1: 3 cabinets
    for (let i = 1; i <= 3; i++) {
      cabinets.push({
        station_id: byName['District 1 Central Station'],
        cabinet_code: `Cabinet A${i}`,
        battery_capacity: 10,
        power_capacity_kw: 150.00,
        status: 'operational'
      });
    }

    // Station 2: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        station_id: byName['District 3 Tech Hub'],
        cabinet_code: `Cabinet B${i}`,
        battery_capacity: 8,
        power_capacity_kw: 120.00,
        status: 'operational'
      });
    }

    // Station 3: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        station_id: byName['Binh Thanh Station'],
        cabinet_code: `Cabinet C${i}`,
        battery_capacity: 12,
        power_capacity_kw: 180.00,
        status: 'operational'
      });
    }

    // Station 4: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        station_id: byName['Thu Duc Service Center'],
        cabinet_code: `Cabinet D${i}`,
        battery_capacity: 10,
        power_capacity_kw: 150.00,
        status: 'operational'
      });
    }

    // Station 5: 1 cabinet (maintenance)
    cabinets.push({
      station_id: byName['Tan Binh Airport Station'],
      cabinet_code: `Cabinet E1`,
      battery_capacity: 8,
      power_capacity_kw: 120.00,
      status: 'maintenance'
    });

    await db.Cabinet.bulkCreate(cabinets, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Cabinets', null, {});
  }
};
