// seeders/11-cabinets.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch station IDs to avoid hardcoding
    const stations = await queryInterface.sequelize.query(
      `SELECT station_id, station_name FROM "Stations"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byName = stations.reduce((acc, s) => {
      acc[s.station_name] = s.station_id;
      return acc;
    }, {});

    const cabinets = [];

    // District 1 Central Station: 3 cabinets
    for (let i = 1; i <= 3; i++) {
      cabinets.push({
        station_id: byName['District 1 Central Station'],
        cabinet_code: `Cabinet A${i}`,
        battery_capacity: 10,
        power_capacity_kw: 150.0,
        status: 'operational'
      });
    }

    // District 3 Tech Hub: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        station_id: byName['District 3 Tech Hub'],
        cabinet_code: `Cabinet B${i}`,
        battery_capacity: 8,
        power_capacity_kw: 120.0,
        status: 'operational'
      });
    }

    // Binh Thanh Station: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        station_id: byName['Binh Thanh Station'],
        cabinet_code: `Cabinet C${i}`,
        battery_capacity: 12,
        power_capacity_kw: 180.0,
        status: 'operational'
      });
    }

    // Thu Duc Service Center: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        station_id: byName['Thu Duc Service Center'],
        cabinet_code: `Cabinet D${i}`,
        battery_capacity: 10,
        power_capacity_kw: 150.0,
        status: 'operational'
      });
    }

    // Tan Binh Airport Station: 1 cabinet (maintenance)
    cabinets.push({
      station_id: byName['Tan Binh Airport Station'],
      cabinet_code: 'Cabinet E1',
      battery_capacity: 8,
      power_capacity_kw: 120.0,
      status: 'maintenance'
    });

    await queryInterface.bulkInsert('Cabinets', cabinets, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Cabinets', null, {});
  }
};
