// seeders/08-subscriptions.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy thông tin invoices đã tạo
    const invoices = await queryInterface.sequelize.query(
      `SELECT invoice_id, driver_id 
       FROM "Invoices" 
       ORDER BY create_date, invoice_number`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Lấy thông tin vehicles
    const vehicles = await queryInterface.sequelize.query(
      `SELECT vehicle_id, driver_id 
       FROM "Vehicles"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Lấy thông tin plans
    const plans = await queryInterface.sequelize.query(
      `SELECT plan_id, plan_name 
       FROM "SubscriptionPlans"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byName = plans.reduce((acc, p) => { acc[p.plan_name] = p.plan_id; return acc; }, {});

    const planNames = [
      'Unlimited Basic',
      'Unlimited Standard',
      'Unlimited Premium',
      'Basic Plan',
      'Standard Plan',
      'Premium Plan'
    ];

    const fallbackPlanId = plans.length ? plans[0].plan_id : null;

    // Tạo subscriptions dựa trên invoices
    const subscriptions = invoices.map((invoice, index) => {
      // Match vehicle với driver_id
      const vehicle = vehicles.find(v => v.driver_id === invoice.driver_id) || vehicles[index % vehicles.length];
      
      return {
        invoice_id: invoice.invoice_id,
        driver_id: invoice.driver_id,
        vehicle_id: vehicle.vehicle_id,
        plan_id: byName[planNames[index % planNames.length]] || fallbackPlanId,
        soh_usage: 0,
        swap_count: 0,
        start_date: '2024-10-01',
        end_date: '2024-12-31',
        cancel_time: null,
        sub_status: 'active'
      };
    });

    await db.Subscription.bulkCreate(subscriptions, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Subscriptions', null, {});
  }
};
