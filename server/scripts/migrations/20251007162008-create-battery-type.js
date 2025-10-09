'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BatteryTypes', {
      battery_type_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      battery_type_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      nominal_capacity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      nominal_voltage: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      energy_capacity_wh: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      rated_power: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      cell_chemistry: {
        type: Sequelize.ENUM('Li-ion','LFP'),
        allowNull: false
      },
      weight: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BatteryTypes');
  }
};