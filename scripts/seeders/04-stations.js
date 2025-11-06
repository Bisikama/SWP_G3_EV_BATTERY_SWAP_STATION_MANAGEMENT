// seeders/04-stations.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert('Stations', [
      {
        station_name: 'District 1 Central Station',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        latitude: 10.7769,
        longitude: 106.7009,
        status: 'operational'
      },
      {
        station_name: 'District 3 Tech Hub',
        address: '456 Võ Văn Tần, Quận 3, TP.HCM',
        latitude: 10.7829,
        longitude: 106.6922,
        status: 'operational'
      },
      {
        station_name: 'Binh Thanh Station',
        address: '789 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
        latitude: 10.8142,
        longitude: 106.7054,
        status: 'operational'
      },
      {
        station_name: 'Thu Duc Service Center',
        address: '321 Võ Văn Ngân, Thủ Đức, TP.HCM',
        latitude: 10.8505,
        longitude: 106.7717,
        status: 'operational'
      },
      {
        station_name: 'Tan Binh Airport Station',
        address: '147 Hoàng Văn Thụ, Tân Bình, TP.HCM',
        latitude: 10.8124,
        longitude: 106.6657,
        status: 'maintenance'
      }
  ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Stations', null, {});
  }
};
