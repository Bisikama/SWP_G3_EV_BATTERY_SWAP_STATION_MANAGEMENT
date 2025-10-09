'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stations', {
      station_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      station_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('operational', 'maintenance', 'closed'),
        allowNull: false,
        defaultValue: 'operational'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Stations');
  }
};