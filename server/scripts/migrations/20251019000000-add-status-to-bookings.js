'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM type for booking status (skip if exists)
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_Bookings_status" AS ENUM ('pending', 'completed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add status column to Bookings table
    await queryInterface.addColumn('Bookings', 'status', {
      type: Sequelize.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    });

    console.log('✅ Added status column to Bookings table');
  },

  async down(queryInterface, Sequelize) {
    // Remove status column
    await queryInterface.removeColumn('Bookings', 'status');
    
    // Drop ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Bookings_status";
    `);

    console.log('✅ Removed status column from Bookings table');
  }
};
