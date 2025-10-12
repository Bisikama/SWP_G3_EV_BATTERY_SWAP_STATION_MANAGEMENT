'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransferRecords', {
      transfer_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      warehouse_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Warehouses',
          key: 'warehouse_id'
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
      manager_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      create_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      accept_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      confirm_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'confirmed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TransferRecords');
  }
};
