'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SupportTickets', {
      ticket_id: {
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
      admin_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      create_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      resolve_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      subject: {
        type: Sequelize.ENUM(
          'battery_issue',
          'vehicle_issue',
          'station_issue',
          'account_issue',
          'payment_issue',
          'other'
        ),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending','resolved'),
        allowNull: false,
        defaultValue: 'pending'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SupportTickets');
  }
};