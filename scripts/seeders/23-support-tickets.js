// seeders/23-support-tickets.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE role = 'driver'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE role = 'admin'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (drivers.length === 0 || admins.length === 0) {
      console.log('No drivers or admins found, skipping support tickets seeder');
      return;
    }

    const subjects = [
      'battery_issue',
      'vehicle_issue',
      'station_issue',
      'account_issue',
      'payment_issue',
      'other'
    ];

    const descriptions = {
      battery_issue: [
        'Battery not charging properly at station',
        'Battery drains faster than expected',
        'Battery health indicator showing error',
        'Swapped battery has lower capacity',
        'Battery overheating during charging'
      ],
      vehicle_issue: [
        'Vehicle not detecting new battery after swap',
        'Battery connection error on dashboard',
        'Vehicle range calculation incorrect',
        'Battery authentication failed',
        'Vehicle compatibility issue with battery'
      ],
      station_issue: [
        'Station cabinet door malfunction',
        'No available battery slots at station',
        'Station screen not responding',
        'Cabinet not opening after payment',
        'Station location incorrect on map'
      ],
      account_issue: [
        'Cannot update phone number in profile',
        'Email verification not working',
        'Password reset link expired',
        'Profile picture upload failed',
        'Unable to delete account'
      ],
      payment_issue: [
        'Payment failed but amount was deducted',
        'Invoice amount incorrect',
        'Refund not received after cancellation',
        'Credit card not accepted',
        'Duplicate payment charged'
      ],
      other: [
        'General inquiry about subscription plans',
        'How to upgrade subscription plan',
        'Request for new station location',
        'App feature suggestion',
        'Feedback on service quality'
      ]
    };

    const tickets = [];
    const now = new Date();

    // Tạo 150 support tickets trong 90 ngày
    for (let i = 0; i < 150; i++) {
      const subject = subjects[i % subjects.length];
      const daysAgo = Math.floor(Math.random() * 90);
      const createDate = new Date(now);
      createDate.setDate(createDate.getDate() - daysAgo);
      createDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0);

      // 80% resolved, 20% pending
      const statusRand = Math.random();
      let status, resolveDate;
      
      if (statusRand < 0.8) {
        status = 'resolved';
        // Resolve trong 1-5 ngày sau khi tạo
        const resolveHours = (1 + Math.random() * 4) * 24;
        resolveDate = new Date(createDate.getTime() + resolveHours * 60 * 60 * 1000);
      } else {
        status = 'pending';
        resolveDate = null;
      }

      const descArray = descriptions[subject];
      const description = descArray[Math.floor(Math.random() * descArray.length)];

      // RANDOM driver và admin thay vì sequential
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
      const randomAdmin = admins[Math.floor(Math.random() * admins.length)];

      tickets.push({
        ticket_id: uuidv4(),
        driver_id: randomDriver.account_id,
        admin_id: randomAdmin.account_id,
        create_date: createDate,
        resolve_date: resolveDate,
        subject: subject,
        description: description,
        status: status
      });
    }

    // Sắp xếp theo thời gian
    tickets.sort((a, b) => a.create_date - b.create_date);

    await queryInterface.bulkInsert('SupportTickets', tickets, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SupportTickets', null, {});
  }
};
