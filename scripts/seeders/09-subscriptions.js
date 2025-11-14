'use strict';
const { v4: uuidv4 } = require('uuid');
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {

    // Invoices
    const invoices = await queryInterface.sequelize.query(
      `SELECT invoice_id, driver_id 
       FROM "Invoices" 
       ORDER BY create_date, invoice_number`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Vehicles
    const vehicles = await queryInterface.sequelize.query(
      `SELECT vehicle_id, driver_id 
       FROM "Vehicles"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Plans
    const plans = await queryInterface.sequelize.query(
      `SELECT plan_id, plan_name 
       FROM "SubscriptionPlans"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byName = plans.reduce((acc, p) => {
      acc[p.plan_name] = p.plan_id;
      return acc;
    }, {});

    // === REAL plan names ===
    // Unlimited 30 / Unlimited 60 / Unlimited 90
    const planDistribution = [
      { name: 'Unlimited 30', weight: 55 },
      { name: 'Unlimited 60', weight: 30 },
      { name: 'Unlimited 90', weight: 15 }
    ];

    const getRandomPlan = () => {
      const rand = Math.random() * 100;
      let cumulative = 0;

      for (const plan of planDistribution) {
        cumulative += plan.weight;
        if (rand <= cumulative) return plan.name;
      }
      return 'Unlimited 30';
    };

    const fallbackPlanId = plans.length ? plans[0].plan_id : null;

    // Generate subscriptions
    const subscriptions = [];
    const now = new Date();

    invoices.forEach((invoice, invoiceIndex) => {
      const vehicle =
        vehicles.find(v => v.driver_id === invoice.driver_id) ||
        vehicles[invoiceIndex % vehicles.length];

      for (let subIndex = 0; subIndex < 4; subIndex++) {
        const daysAgo = 90 - subIndex * 22;
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysAgo);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);

        // --- REALISTIC PLAN BEHAVIOR ---
        let planName;

        if (subIndex === 0) {
          // First subscription = user still exploring
          const trial = Math.random();
          if (trial < 0.70) {
            planName = 'Unlimited 30'; // lowest risk
          } else if (trial < 0.90) {
            planName = 'Unlimited 60';
          } else {
            planName = 'Unlimited 90';
          }
        } else if (subIndex === 1 || subIndex === 2) {
          // Middle: experimenting
          if (Math.random() < 0.6) {
            planName = getRandomPlan();
          } else {
            // force change
            const options = ['Unlimited 30', 'Unlimited 60', 'Unlimited 90'];
            planName = options[Math.floor(Math.random() * options.length)];
          }
        } else {
          // Final subscription
          planName = getRandomPlan();
        }

        // --- Status ---
        let status, cancelTime;

        if (subIndex === 3) {
          if (Math.random() < 0.95) {
            status = 'active';
            cancelTime = null;
          } else {
            status = 'inactive';
            cancelTime = new Date(startDate.getTime() + Math.random() * 15 * 86400000);
          }
        } else {
          status = 'inactive';
          cancelTime =
            Math.random() < 0.2
              ? new Date(startDate.getTime() + Math.random() * 15 * 86400000)
              : null;
        }

        // --- swap count ---
        let swapCount;
        if (planName === 'Unlimited 90') {
          swapCount = 15 + Math.floor(Math.random() * 10);
        } else if (planName === 'Unlimited 60') {
          swapCount = 10 + Math.floor(Math.random() * 10);
        } else {
          swapCount = Math.floor(Math.random() * 10);
        }

        subscriptions.push({
          subscription_id: uuidv4(),
          invoice_id: invoice.invoice_id,
          driver_id: invoice.driver_id,
          vehicle_id: vehicle.vehicle_id,
          plan_id: byName[planName] || fallbackPlanId,
          swap_count: swapCount,
          start_date: startDate,
          end_date: endDate,
          cancel_time: cancelTime,
          status
        });
      }
    });

    await queryInterface.bulkInsert('Subscriptions', subscriptions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Subscriptions', null, {});
  }
};
