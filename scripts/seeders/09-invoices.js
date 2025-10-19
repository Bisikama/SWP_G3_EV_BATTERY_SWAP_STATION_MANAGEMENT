// seeders/09-invoices.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const subscriptions = await queryInterface.sequelize.query(
      `SELECT s.subscription_id, s.driver_id, sp.plan_fee 
       FROM "Subscriptions" s 
       JOIN "SubscriptionPlans" sp ON s.plan_id = sp.plan_id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const invoices = subscriptions.map((sub, index) => ({
      driver_id: sub.driver_id,
      subscription_id: sub.subscription_id,
      invoice_number: `INV-2024-10-${String(index + 1).padStart(4, '0')}`,
      create_date: new Date('2024-10-01'),
      due_date: new Date('2024-10-15'),
      total_fee: sub.plan_fee
    }));

  await db.Invoice.bulkCreate(invoices, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Invoices', null, {});
  }
};
