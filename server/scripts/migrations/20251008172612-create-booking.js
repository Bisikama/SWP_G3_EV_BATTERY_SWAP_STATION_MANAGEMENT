'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      booking_id: {
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
      booking_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      scheduled_start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      scheduled_end_time: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bookings');
  }
};