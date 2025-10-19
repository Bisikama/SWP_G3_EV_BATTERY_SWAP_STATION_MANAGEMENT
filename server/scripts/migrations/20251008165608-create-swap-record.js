'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SwapRecords', {
      swap_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      driver_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      vehicle_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Vehicles',
          key: 'vehicle_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      battery_id_in: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Batteries',
          key: 'battery_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      battery_id_out: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Batteries',
          key: 'battery_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      soh_in: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0 }
      },
      soh_out: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0 }
      },
      swap_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SwapRecords');
  }
};