// seeders/09-invoices.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy thông tin vehicles và drivers
    const vehicles = await queryInterface.sequelize.query(
      `SELECT v.vehicle_id, v.driver_id 
       FROM "Vehicles" v`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Lấy thông tin subscription plans
    const plans = await queryInterface.sequelize.query(
      `SELECT plan_id, plan_name, plan_fee 
       FROM "SubscriptionPlans"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byName = plans.reduce((acc, p) => { acc[p.plan_name] = p; return acc; }, {});

    const planNames = [
      'Unlimited Basic',
      'Unlimited Standard',
      'Unlimited Premium',
      'Basic Plan',
      'Standard Plan',
      'Premium Plan'
    ];

    // Tạo invoices cho mỗi vehicle
    const invoices = vehicles.map((vehicle, index) => {
      const planName = planNames[index % planNames.length];
      const plan = byName[planName] || plans[0];
      const planFee = typeof plan.plan_fee === 'string' ? parseFloat(plan.plan_fee) : Number(plan.plan_fee || 0);
      const totalFee = Math.round(planFee);

      return {
        driver_id: vehicle.driver_id,
        invoice_number: `INV-2024-10-${String(index + 1).padStart(4, '0')}`,
        create_date: '2024-10-01',
        due_date: '2024-10-31',
        total_fee: totalFee
      };
    });

    await db.Invoice.bulkCreate(invoices, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Invoices', null, {});
  }
};
