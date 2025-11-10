'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Configs', [
      {
        config_name: 'default',
        booking_expired_interval: 30,
        soh_available_threshole: 90,
        soh_maintenance_threshole: 70,
        soc_available_threshole: 90,
        allowed_empty_slot: 3
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Configs', { config_name: 'default' }, {});
  }
};
