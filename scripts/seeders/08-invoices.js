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

    // REALISTIC PLAN DISTRIBUTION - Giống như Subscriptions
    const planDistribution = [
      { name: 'Unlimited Basic', weight: 40 },      // Sweet spot
      { name: 'Standard Plan', weight: 25 },         // Flexible
      { name: 'Unlimited Standard', weight: 15 },    // Upgrade
      { name: 'Basic Plan', weight: 10 },            // Budget
      { name: 'Premium Plan', weight: 7 },           // Premium
      { name: 'Unlimited Premium', weight: 3 }       // Luxury
    ];

    const getRandomPlan = () => {
      const rand = Math.random() * 100;
      let cumulative = 0;
      for (const plan of planDistribution) {
        cumulative += plan.weight;
        if (rand <= cumulative) return plan.name;
      }
      return 'Unlimited Basic';
    };

    // Generate multiple invoices per vehicle (3 invoices per driver over 3 months)
    // Total: 50 drivers * 3 = 150 invoices
    const now = new Date();
    const invoices = [];
    
    vehicles.forEach((vehicle, vehicleIndex) => {
      // Mỗi driver có 3 invoices trong 3 tháng
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        // Sử dụng weighted distribution thay vì sequential
        const planName = getRandomPlan();
        const plan = byName[planName] || plans[0];
        const planFee = Math.round(parseFloat(plan.plan_fee) || 0);

        const totalSwapFee = Math.round(planFee * 0.05);   // 5% of plan fee
        const totalPenaltyFee = Math.round(planFee * 0.02); // 2% of plan fee

        // 80% paid, 20% unpaid for realistic revenue data
        const paymentStatus = Math.random() < 0.8 ? 'paid' : 'unpaid';

        // FIXED: Phân bổ đều trong 90 ngày
        // Mỗi invoice của mỗi driver sẽ random trong toàn bộ 90 ngày
        // Không còn tập trung vào 3-4 ngày nữa
        const daysAgo = Math.floor(Math.random() * 90); // Random từ 0-89 ngày trước
        const createDate = new Date(now);
        createDate.setDate(createDate.getDate() - daysAgo);
        const createDateStr = createDate.toISOString().split('T')[0]; // YYYY-MM-DD

        const invoiceNumber = `INV-${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, '0')}-${String(vehicleIndex * 3 + monthOffset + 1).padStart(4, '0')}`;

        invoices.push({
          invoice_id: uuidv4(),
          driver_id: vehicle.driver_id,
          invoice_number: invoiceNumber,
          create_date: createDateStr,
          plan_fee: planFee,
          total_swap_fee: totalSwapFee,
          total_penalty_fee: totalPenaltyFee,
          payment_status: paymentStatus
        });
      }
    });

    await queryInterface.bulkInsert('Invoices', invoices, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Invoices', null, {});
  }
};
