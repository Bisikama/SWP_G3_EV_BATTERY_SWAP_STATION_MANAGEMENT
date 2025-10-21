// seeders/10-payment-records.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const invoices = await queryInterface.sequelize.query(
      `SELECT invoice_id, total_fee FROM "Invoices"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const paymentMethods = ['credit_card', 'bank_transfer', 'e-wallet', 'momo', 'zalopay'];
    
    const payments = invoices.map((invoice, index) => ({
      invoice_id: invoice.invoice_id,
      transaction_num: `TXN-${Date.now()}-${index}`,
      payment_date: new Date('2024-10-05'),
      payment_method: paymentMethods[index % paymentMethods.length],
      amount: invoice.total_fee,
      status: index % 10 === 0 ? 'fail' : 'success' // 10% failure rate
    }));

  await db.PaymentRecord.bulkCreate(payments, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PaymentRecords', null, {});
  }
};
