'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('PaymentRecords', 'message', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Payment result message from MoMo'
    });

    await queryInterface.addColumn('PaymentRecords', 'payment_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Payment type: qr, app, web, etc.'
    });

    await queryInterface.addColumn('PaymentRecords', 'signature', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'MoMo signature for verification'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('PaymentRecords', 'message');
    await queryInterface.removeColumn('PaymentRecords', 'payment_type');
    await queryInterface.removeColumn('PaymentRecords', 'signature');
  }
};
