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
      staff_id: {
        type: Sequelize.UUID,
        unique: true,
        allowNull: true,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('operational', 'closed'),
        allowNull: false,
        defaultValue: 'operational'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Stations');
  }
};