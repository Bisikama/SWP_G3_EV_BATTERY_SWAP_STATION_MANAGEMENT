'use strict';
const { v4: uuidv4 } = require('uuid');
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
    
    // REALISTIC PLAN DISTRIBUTION - Mô phỏng hành vi thực tế của người dùng
    // Phân bổ theo tâm lý: giá rẻ nhiều người dùng, trung bình ổn, đắt ít người
    const planDistribution = [
      // TOP CHOICE (40%): Unlimited Basic - Balance tốt giữa giá và giá trị
      { name: 'Unlimited Basic', weight: 40, reason: 'sweet_spot' },
      
      // POPULAR (25%): Standard Plan - Pay-per-swap phổ biến nhất
      { name: 'Standard Plan', weight: 25, reason: 'flexible' },
      
      // MODERATE (15%): Unlimited Standard - Nâng cấp từ Basic
      { name: 'Unlimited Standard', weight: 15, reason: 'upgrade' },
      
      // BUDGET (10%): Basic Plan - Người dùng ít swap
      { name: 'Basic Plan', weight: 10, reason: 'budget' },
      
      // PREMIUM (7%): Premium Plan - Người dùng cao cấp, swap nhiều
      { name: 'Premium Plan', weight: 7, reason: 'premium' },
      
      // LEAST POPULAR (3%): Unlimited Premium - Quá đắt, chỉ doanh nghiệp
      { name: 'Unlimited Premium', weight: 3, reason: 'luxury' }
    ];

    // Tạo weighted random function
    const getRandomPlan = () => {
      const rand = Math.random() * 100;
      let cumulative = 0;
      
      for (const plan of planDistribution) {
        cumulative += plan.weight;
        if (rand <= cumulative) {
          return plan.name;
        }
      }
      
      return 'Unlimited Basic'; // Fallback
    };

    const fallbackPlanId = plans.length ? plans[0].plan_id : null;

    // Tạo 200 subscriptions: mỗi driver có 4 subscriptions trong 3 tháng
    // Mô phỏng: renewal, upgrade, downgrade
    const subscriptions = [];
    const now = new Date();

    invoices.forEach((invoice, invoiceIndex) => {
      const vehicle = vehicles.find(v => v.driver_id === invoice.driver_id) || vehicles[invoiceIndex % vehicles.length];

      // Mỗi driver có 4 subscriptions trải dài 90 ngày
      // Mô phỏng behavior: trial → settle → upgrade/downgrade → current
      for (let subIndex = 0; subIndex < 4; subIndex++) {
        const daysAgo = 90 - (subIndex * 22); // Phân bổ đều: 0, 22, 44, 66 ngày trước
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysAgo);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30); // Mỗi subscription 30 ngày

        // REALISTIC PLAN SELECTION theo lifecycle
        let planName;
        
        if (subIndex === 0) {
          // Subscription đầu tiên (66 ngày trước): 60% chọn Basic/Standard Plan để thử
          const trial = Math.random();
          if (trial < 0.35) planName = 'Basic Plan';
          else if (trial < 0.70) planName = 'Standard Plan';
          else planName = getRandomPlan();
        } 
        else if (subIndex === 1 || subIndex === 2) {
          // Subscription giữa: Người dùng thử nghiệm, có thể upgrade/downgrade
          const experiment = Math.random();
          if (experiment < 0.60) {
            planName = getRandomPlan(); // 60% follow distribution
          } else {
            // 40% thử plan khác
            const allPlans = ['Unlimited Basic', 'Unlimited Standard', 'Standard Plan', 'Premium Plan'];
            planName = allPlans[Math.floor(Math.random() * allPlans.length)];
          }
        }
        else {
          // Subscription cuối (hiện tại): Người dùng đã tìm được plan phù hợp
          planName = getRandomPlan(); // Follow realistic distribution
        }

        // Logic: CHỈ subscription mới nhất (subIndex = 3) có thể active
        // Các subscription cũ (subIndex < 3) phải là inactive
        let status, cancelTime;
        
        if (subIndex === 3) {
          // Subscription mới nhất: 95% active, 5% inactive
          if (Math.random() < 0.95) {
            status = 'active';
            cancelTime = null;
          } else {
            status = 'inactive';
            cancelTime = new Date(startDate.getTime() + Math.random() * 15 * 24 * 60 * 60 * 1000);
          }
        } else {
          // Subscription cũ: tất cả đều inactive
          status = 'inactive';
          // 20% bị cancelled (có cancel_time), 80% hết hạn tự nhiên (no cancel_time)
          if (Math.random() < 0.2) {
            cancelTime = new Date(startDate.getTime() + Math.random() * 15 * 24 * 60 * 60 * 1000);
          } else {
            cancelTime = null; // Hết hạn tự nhiên
          }
        }

        // SOH usage và swap count theo plan type
        let sohUsage, swapCount;
        if (planName.includes('Unlimited')) {
          // Unlimited plans: swap nhiều hơn
          sohUsage = 0.02 + Math.random() * 0.05; // 2-7%
          swapCount = 10 + Math.floor(Math.random() * 15); // 10-25 swaps
        } else {
          // Pay-per-swap plans: swap ít hơn
          sohUsage = Math.random() * 0.03; // 0-3%
          swapCount = Math.floor(Math.random() * 10); // 0-10 swaps
        }

        subscriptions.push({
          subscription_id: uuidv4(),
          invoice_id: invoice.invoice_id,
          driver_id: invoice.driver_id,
          vehicle_id: vehicle.vehicle_id,
          plan_id: byName[planName] || fallbackPlanId,
          soh_usage: sohUsage,
          swap_count: swapCount,
          start_date: startDate,
          end_date: endDate,
          cancel_time: cancelTime,
          status: status
        });
      }
    });

    await queryInterface.bulkInsert('Subscriptions', subscriptions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Subscriptions', null, {});
  }
};
