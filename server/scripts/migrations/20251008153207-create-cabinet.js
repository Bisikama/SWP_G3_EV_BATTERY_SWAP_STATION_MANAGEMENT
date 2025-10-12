'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Cabinets', {
      cabinet_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      station_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'station_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cabinet_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      power_capacity_kw: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      status: {
        type: Sequelize.ENUM('operational', 'maintenance'),
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Cabinets');
  }
};