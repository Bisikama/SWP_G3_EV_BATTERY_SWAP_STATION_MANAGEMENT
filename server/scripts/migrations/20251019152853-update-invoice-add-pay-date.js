'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Invoices');
    
    // 1. Thêm column pay_date (check if exists first)
    if (!tableDescription.pay_date) {
      await queryInterface.addColumn('Invoices', 'pay_date', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
    }

    // 2. Sửa due_date thành nullable  
    await queryInterface.changeColumn('Invoices', 'due_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    // 3. Update payment_status ENUM - bỏ 'cancelled'
    // Check if payment_status exists first
    if (tableDescription.payment_status) {
      await queryInterface.removeColumn('Invoices', 'payment_status');
    }
    await queryInterface.addColumn('Invoices', 'payment_status', {
      type: Sequelize.ENUM('paid', 'unpaid'),
      allowNull: false,
      defaultValue: 'unpaid'
    });
  },

  async down (queryInterface, Sequelize) {
    // Rollback: Xóa pay_date
    await queryInterface.removeColumn('Invoices', 'pay_date');

    // Rollback: due_date về allowNull: false
    await queryInterface.changeColumn('Invoices', 'due_date', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });

    // Rollback: payment_status thêm lại 'cancelled'
    await queryInterface.removeColumn('Invoices', 'payment_status');
    await queryInterface.addColumn('Invoices', 'payment_status', {
      type: Sequelize.ENUM('paid', 'unpaid'),
      allowNull: false,
      defaultValue: 'unpaid'
    });
  }
};


