'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Batteries', {
      battery_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      vehicle_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Vehicles',
          key: 'vehicle_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      slot_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'CabinetSlots',
          key: 'slot_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      battery_serial: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      current_soc: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      current_soh: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Batteries');
  }
};