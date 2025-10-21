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
        // === GÓI KHÔNG THEO LƯỢT (fee_slot = 0) ===
        {
          admin_id: admins[0].account_id,
          plan_name: 'Unlimited Basic',
          plan_fee: '500000.00',
          swap_fee: '0.00', // fee_slot = 0 => not per-slot
          penalty_fee: '50000.00',
          battery_cap: 1,
          soh_cap: '0.03',
          duration_days: 30,
          description: 'Gói không giới hạn lượt đổi - phù hợp người dùng thường xuyên',
          is_active: true
        },
        {
          admin_id: admins[0].account_id,
          plan_name: 'Unlimited Standard',
          plan_fee: '800000.00',
          swap_fee: '0.00',
          penalty_fee: '80000.00',
          battery_cap: 2,
          soh_cap: '0.05',
          duration_days: 30,
          description: 'Gói không giới hạn lượt đổi - hỗ trợ 2 pin cùng lúc',
          is_active: true
        },
        {
          admin_id: admins[0].account_id,
          plan_name: 'Unlimited Premium',
          plan_fee: '1200000.00',
          swap_fee: '0.00',
          penalty_fee: '100000.00',
          battery_cap: 3,
          soh_cap: '0.07',
          duration_days: 30,
          description: 'Gói không giới hạn lượt đổi - dành cho doanh nghiệp',
          is_active: true
        },

        // === GÓI THEO LƯỢT (fee_slot > 0) ===
        {
          admin_id: admins[0].account_id,
          plan_name: 'Basic Plan',
          plan_fee: '200000.00',
          swap_fee: '8000.00', // fee_slot -> swap_fee
          penalty_fee: '200.00',
          battery_cap: 1,
          soh_cap: '0.03',
          duration_days: 30,
          description: 'Gói cơ bản - thanh toán theo lượt đổi pin',
          is_active: true
        },
        {
          admin_id: admins[0].account_id,
          plan_name: 'Standard Plan',
          plan_fee: '350000.00',
          swap_fee: '7500.00',
          penalty_fee: '400.00',
          battery_cap: 2,
          soh_cap: '0.05',
          duration_days: 30,
          description: 'Gói tiêu chuẩn - thanh toán theo lượt với giá ưu đãi',
          is_active: true
        },
        {
          admin_id: admins[0].account_id,
          plan_name: 'Premium Plan',
          plan_fee: '500000.00',
          swap_fee: '7000.00',
          penalty_fee: '600.00',
          battery_cap: 3,
          soh_cap: '0.07',
          duration_days: 30,
          description: 'Gói cao cấp - thanh toán theo lượt với giá tốt nhất',
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
