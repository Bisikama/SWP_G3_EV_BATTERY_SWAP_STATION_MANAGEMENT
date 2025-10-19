// seeders/06-subscription-plans.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'admin' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!admins.length) {
      throw new Error('No admin account found to assign to SubscriptionPlans.');
    }

    await db.SubscriptionPlan.bulkCreate(
      [
        {
          admin_id: admins[0].account_id,
          plan_name: 'Basic Plan',
          plan_fee: 200000.0,
          deposit_fee: 400000.0,
          penalty_fee: 200.0,
          battery_cap: 1,
          soh_cap: 0.03,
          duration_days: 30,
          description: 'Basic plan for light users - up to 1 battery at a time.',
          is_active: true
        },
        {
          admin_id: admins[0].account_id,
          plan_name: 'Standard Plan',
          plan_fee: 500000.0,
          deposit_fee: 400000.0,
          penalty_fee: 300.0,
          battery_cap: 1,
          soh_cap: 0.05,
          duration_days: 30,
          description: 'Standard plan - affordable option for daily commuters.',
          is_active: true
        },
        {
          admin_id: admins[0].account_id,
          plan_name: 'Premium Plan',
          plan_fee: 800000.0,
          deposit_fee: 400000.0,
          penalty_fee: 400.0,
          battery_cap: 2,
          soh_cap: 0.08,
          duration_days: 30,
          description: 'Premium plan for high-demand riders - up to 2 batteries.',
          is_active: true
        },
        {
          admin_id: admins[0].account_id,
          plan_name: 'Enterprise Plan',
          plan_fee: 1000000.0,
          deposit_fee: 400000.0,
          penalty_fee: 500.0,
          battery_cap: 2,
          soh_cap: 0.1,
          duration_days: 30,
          description: 'Enterprise fleet plan - optimized for business operators.',
          is_active: true
        }
      ],
      { validate: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};
