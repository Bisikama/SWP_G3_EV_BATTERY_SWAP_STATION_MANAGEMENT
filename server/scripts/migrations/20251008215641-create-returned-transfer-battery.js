'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReturnedTransferBatteries', {
      transfer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TransferRecords',
          key: 'transfer_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      battery_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Batteries',
          key: 'battery_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      soc: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      soh: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      swap_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ReturnedTransferBatteries');
  }
};