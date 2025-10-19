'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingBatteries', {
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Bookings',
          key: 'booking_id'
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('BookingBatteries');
  }
};