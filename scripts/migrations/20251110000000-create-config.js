'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Configs', {
      config_name: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      booking_expired_interval: {
        type: Sequelize.SMALLINT,
        allowNull: false,
        defaultValue: 30,
        comment: 'Booking expiration interval in minutes'
      },
      soh_available_threshole: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'SOH threshold for battery availability (0-100%)'
      },
      soh_maintenance_threshole: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'SOH threshold for battery maintenance (0-100%)'
      },
      soc_available_threshole: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'SOC threshold for battery availability (0-100%)'
      },
      allowed_empty_slot: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of allowed empty slots in cabinet'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Configs');
  }
};
