'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransferBatteryDetails', {
      transfer_detail_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TransferDetails',
          key: 'transfer_detail_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TransferBatteryDetails');
  }
};
