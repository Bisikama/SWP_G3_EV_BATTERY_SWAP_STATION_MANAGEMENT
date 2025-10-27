'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VehicleModels', {
      model_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      battery_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'BatteryTypes',
          key: 'battery_type_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      brand: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      battery_slot: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      avg_energy_usage: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      }
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('VehicleModels');
  }
};