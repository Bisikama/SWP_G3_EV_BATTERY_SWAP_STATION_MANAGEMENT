'use strict';
const { v4: uuidv4 } = require('uuid');
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch vehicles (each vehicle has a driver)
    const vehicles = await queryInterface.sequelize.query(
      `SELECT v.vehicle_id, v.driver_id 
       FROM "Vehicles" v`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Fetch subscription plans
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

    // Generate invoices for each vehicle
    const invoices = vehicles.map((vehicle, index) => {
      const planName = planNames[index % planNames.length];
      const plan = byName[planName] || plans[0];
      const planFee = parseFloat(plan.plan_fee) || 0;

      const totalSwapFee = Math.round(planFee * 0.05);   // 5% of plan fee
      const totalPenaltyFee = Math.round(planFee * 0.02); // 2% of plan fee

      return {
        invoice_id: uuidv4(), // <-- generate UUID for each row
        driver_id: vehicle.driver_id,
        invoice_number: `INV-2024-10-${String(index + 1).padStart(4, '0')}`,
        create_date: '2024-10-01',
        plan_fee: planFee,
        total_swap_fee: totalSwapFee,
        total_penalty_fee: totalPenaltyFee,
        payment_status: 'unpaid'
      };
    });

    await queryInterface.bulkInsert('Invoices', invoices, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Invoices', null, {});
  }
};
