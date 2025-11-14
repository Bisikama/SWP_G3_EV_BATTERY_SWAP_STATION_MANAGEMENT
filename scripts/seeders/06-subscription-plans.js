'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get one admin ID from Accounts table
    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE role = 'admin' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!admins.length) throw new Error('No admin account found to assign to SubscriptionPlans.');

    const subscriptionPlans = [
      // Unlimited plans
      {
        admin_id: admins[0].account_id,
        plan_name: 'Unlimited 30',
        plan_fee: '450000.00',
        duration_days: 30,
        description: 'Gói 30 ngày với số lần đổi pin không giới hạn phù hợp người dùng di chuyển hằng ngày.',
        is_active: true
      },
      {
        admin_id: admins[0].account_id,
        plan_name: 'Unlimited 60',
        plan_fee: '850000.00',
        duration_days: 60,
        description: 'Gói 60 ngày không giới hạn lượt đổi hỗ trợ sử dụng 2 pin cùng lúc.',
        is_active: true
      },
      {
        admin_id: admins[0].account_id,
        plan_name: 'Unlimited 90',
        plan_fee: '1250000.00',
        duration_days: 90,
        description: 'Gói 90 ngày không giới hạn tối ưu cho doanh nghiệp hoặc người dùng cường độ cao.',
        is_active: true
      }
    ];

    await queryInterface.bulkInsert('SubscriptionPlans', subscriptionPlans, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};
