'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransferDetails', {
      transfer_detail_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      transfer_request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TransferRequests',
          key: 'transfer_request_id'
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
      staff_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      confirm_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      transfer_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('incompleted','completed'),
        allowNull: false,
        defaultValue: 'incompleted'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TransferDetails');
  }
};
