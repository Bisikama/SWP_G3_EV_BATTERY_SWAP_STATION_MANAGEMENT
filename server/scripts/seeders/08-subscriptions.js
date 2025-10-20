// seeders/08-subscriptions.js
'use strict';
const db = require('../../src/models');

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

    // Resolve plan ids by name (ensure plans were inserted earlier)
    const plans = await queryInterface.sequelize.query(
      `SELECT plan_id, plan_name FROM "SubscriptionPlans"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byName = plans.reduce((acc, p) => { acc[p.plan_name] = p.plan_id; return acc; }, {});

    // match the plans created by the subscription-plans seeder
    const planNames = [
      'Unlimited Basic',
      'Unlimited Standard',
      'Unlimited Premium',
      'Basic Plan',
      'Standard Plan',
      'Premium Plan'
    ];

    // fallback plan id if a named plan is not found
    const fallbackPlanId = plans.length ? plans[0].plan_id : null;

    const subscriptions = vehicles.map((vehicle, index) => ({
      driver_id: vehicle.driver_id,
      vehicle_id: vehicle.vehicle_id,
      plan_id: byName[planNames[index % planNames.length]] || fallbackPlanId,
      start_date: '2024-10-01',
      end_date: '2024-12-31',
      cancel_time: null
    }));

    await db.Subscription.bulkCreate(subscriptions, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Subscriptions', null, {});
  }
};
