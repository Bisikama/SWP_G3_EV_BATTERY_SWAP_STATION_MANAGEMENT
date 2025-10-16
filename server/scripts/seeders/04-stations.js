// seeders/04-stations.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
  await db.Station.bulkCreate([
      {
        station_name: 'District 1 Central Station',
        address: '123 Nguyen Hue, District 1, HCMC',
        latitude: 10.7769,
        longitude: 106.7009,
        status: 'operational'
      },
      {
        station_name: 'District 3 Tech Hub',
        address: '456 Vo Van Tan, District 3, HCMC',
        latitude: 10.7829,
        longitude: 106.6922,
        status: 'operational'
      },
      {
        station_name: 'Binh Thanh Station',
        address: '789 Xo Viet Nghe Tinh, Binh Thanh, HCMC',
        latitude: 10.8142,
        longitude: 106.7054,
        status: 'operational'
      },
      {
        station_name: 'Thu Duc Service Center',
        address: '321 Vo Van Ngan, Thu Duc, HCMC',
        latitude: 10.8505,
        longitude: 106.7717,
        status: 'operational'
      },
      {
        station_name: 'Tan Binh Airport Station',
        address: '147 Hoang Van Thu, Tan Binh, HCMC',
        latitude: 10.8124,
        longitude: 106.6657,
        status: 'maintenance'
      }
  ], { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Stations', null, {});
  }
};
