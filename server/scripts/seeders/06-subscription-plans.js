// seeders/06-subscription-plans.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'admin' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('SubscriptionPlans', [
      {
        plan_id: 1,
        admin_id: admins[0].account_id,
        plan_name: 'Basic Plan',
        plan_fee: 500000.00,
        battery_cap: 20,
        usage_cap: 100.00,
        description: '20 battery swaps per month - Perfect for occasional users',
        is_active: true
      },
      {
        plan_id: 2,
        admin_id: admins[0].account_id,
        plan_name: 'Standard Plan',
        plan_fee: 900000.00,
        battery_cap: 40,
        usage_cap: 200.00,
        description: '40 battery swaps per month - Great for regular commuters',
        is_active: true
      },
      {
        plan_id: 3,
        admin_id: admins[0].account_id,
        plan_name: 'Premium Plan',
        plan_fee: 1500000.00,
        battery_cap: 80,
        usage_cap: 400.00,
        description: '80 battery swaps per month - Unlimited convenience for daily drivers',
        is_active: true
      },
      {
        plan_id: 4,
        admin_id: admins[0].account_id,
        plan_name: 'Enterprise Plan',
        plan_fee: 2500000.00,
        battery_cap: 150,
        usage_cap: 800.00,
        description: '150 battery swaps per month - For fleet operators',
        is_active: true
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};
