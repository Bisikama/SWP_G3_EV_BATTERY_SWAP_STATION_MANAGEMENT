'use strict';
const { v4: uuidv4 } = require('uuid');
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch invoices with all fee components
    const invoices = await queryInterface.sequelize.query(
      `SELECT invoice_id, plan_fee, total_swap_fee, total_penalty_fee FROM "Invoices"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const paymentMethods = ['credit_card', 'bank_transfer', 'e-wallet', 'momo', 'zalopay'];
    
    const payments = invoices.map((invoice, index) => ({
      payment_id: uuidv4(), // <-- generate UUID for primary key
      invoice_id: invoice.invoice_id,
      transaction_num: `TXN-${Date.now()}-${index}`,
      payment_date: new Date('2024-10-05'),
      payment_method: paymentMethods[index % paymentMethods.length],
      amount: parseFloat(invoice.plan_fee) + parseFloat(invoice.total_swap_fee) + parseFloat(invoice.total_penalty_fee),
      status: index % 10 === 0 ? 'fail' : 'success', // 10% failure rate
      message: null,
      signature: null
    }));

    await queryInterface.bulkInsert('PaymentRecords', payments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PaymentRecords', null, {});
  }
};
