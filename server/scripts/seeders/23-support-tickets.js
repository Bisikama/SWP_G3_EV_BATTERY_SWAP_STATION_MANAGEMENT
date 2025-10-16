// seeders/23-support-tickets.js
 'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'driver'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'admin'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const subjects = [
      'battery_issue',
      'vehicle_issue',
      'station_issue',
      'account_issue',
      'payment_issue',
      'other'
    ];

    const descriptions = {
      battery_issue: 'Battery not charging properly at station',
      vehicle_issue: 'Vehicle not detecting new battery after swap',
      station_issue: 'Station cabinet door malfunction',
      account_issue: 'Cannot update phone number in profile',
      payment_issue: 'Payment failed but amount was deducted',
      other: 'General inquiry about subscription plans'
    };

    const tickets = [];

    for (let i = 0; i < 12; i++) {
      const subject = subjects[i % subjects.length];
      const createDate = new Date();
      createDate.setDate(createDate.getDate() - Math.floor(Math.random() * 30));

      const isResolved = Math.random() > 0.3; // 70% resolved
      let resolveDate = null;

      if (isResolved) {
        resolveDate = new Date(createDate.getTime() + (1 + Math.random() * 5) * 24 * 60 * 60 * 1000);
      }

      tickets.push({
        driver_id: drivers[i % drivers.length].account_id,
        admin_id: admins[i % admins.length].account_id,
        create_date: createDate,
        resolve_date: resolveDate,
        subject: subject,
        description: descriptions[subject],
        status: isResolved ? 'resolved' : 'pending'
      });
    }

    await db.SupportTicket.bulkCreate(tickets, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SupportTickets', null, {});
  }
};
