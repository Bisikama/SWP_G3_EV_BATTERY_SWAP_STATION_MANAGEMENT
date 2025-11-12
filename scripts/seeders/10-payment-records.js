'use strict';
const { v4: uuidv4 } = require('uuid');
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch invoices with all fee components
    const invoices = await queryInterface.sequelize.query(
      `SELECT invoice_id, plan_fee, total_swap_fee FROM "Invoices"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (invoices.length === 0) {
      console.log('No invoices found, skipping payment records seeder');
      return;
    }

    const paymentMethods = ['credit_card', 'bank_transfer', 'e-wallet', 'momo', 'zalopay'];
    const payments = [];
    const now = new Date();
    
    // Mỗi invoice có thể có nhiều payment records trong 3 tháng
    // Mô phỏng: thanh toán định kỳ hàng tháng/tuần
    invoices.forEach((invoice, invoiceIndex) => {
      // Mỗi invoice có 3 payment records (1 mỗi tháng trong 3 tháng)
      for (let month = 0; month < 3; month++) {
        const daysAgo = 90 - (month * 30) - Math.floor(Math.random() * 5); // Phân bổ đều mỗi tháng
        const paymentDate = new Date(now);
        paymentDate.setDate(paymentDate.getDate() - daysAgo);
        
        // 95% success, 5% fail
        const isSuccess = Math.random() > 0.05;
        
        payments.push({
          payment_id: uuidv4(),
          invoice_id: invoice.invoice_id,
          transaction_num: `TXN${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}${String(invoiceIndex).padStart(3, '0')}${month}`,
          payment_date: paymentDate,
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          amount: parseFloat(invoice.plan_fee) + parseFloat(invoice.total_swap_fee),
          status: isSuccess ? 'success' : 'fail',
          message: isSuccess ? 'Payment processed successfully' : 'Payment failed - insufficient funds',
          signature: isSuccess ? `SIG-${uuidv4().substring(0, 8)}` : null
        });
      }
    });

    // Sắp xếp theo ngày
    payments.sort((a, b) => a.payment_date - b.payment_date);

    await queryInterface.bulkInsert('PaymentRecords', payments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PaymentRecords', null, {});
  }
};
