// seeders/08-subscriptions.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'driver'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const vehicles = await queryInterface.sequelize.query(
      `SELECT vehicle_id, driver_id FROM "Vehicles"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const subscriptions = vehicles.map((vehicle, index) => ({
      subscription_id: uuidv4(),
      driver_id: vehicle.driver_id,
      vehicle_id: vehicle.vehicle_id,
      plan_id: (index % 4) + 1, // Distribute across 4 plans
      start_date: new Date('2024-10-01'),
      end_date: new Date('2024-12-31'),
      status: 'in-use'
    }));

    await queryInterface.bulkInsert('Subscriptions', subscriptions);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Subscriptions', null, {});
  }
};
