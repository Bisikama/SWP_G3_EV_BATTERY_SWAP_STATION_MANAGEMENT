// seeders/14-shifts.js
'use strict';
const db = require('../../src/models');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE role = 'admin'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const staff = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE role = 'staff'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM "Stations" WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const shifts = [];
    const today = new Date();
    
    // Create shifts for next 7 days
    for (let day = 0; day < 7; day++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + day);
      shiftDate.setHours(0, 0, 0, 0); // Reset to midnight

      // Random staff assignment per day để tránh cùng staff nhiều stations cùng lúc
      const usedStaffMorning = new Set();
      const usedStaffAfternoon = new Set();

      stations.forEach((station, stationIndex) => {
        // Morning shift: 7 AM - 3 PM (8 hours)
        const morningStart = new Date(shiftDate);
        morningStart.setHours(7, 0, 0, 0);
        const morningEnd = new Date(shiftDate);
        morningEnd.setHours(15, 0, 0, 0);

        // Random staff cho morning shift, tránh duplicate
        let morningStaffId;
        let attempts = 0;
        do {
          morningStaffId = staff[Math.floor(Math.random() * staff.length)].account_id;
          attempts++;
        } while (usedStaffMorning.has(morningStaffId) && attempts < 20);
        usedStaffMorning.add(morningStaffId);

        shifts.push({
          shift_id: uuidv4(),
          admin_id: admins[0].account_id,
          staff_id: morningStaffId,
          station_id: station.station_id,
          start_time: morningStart,
          end_time: morningEnd,
        });

        // Afternoon shift: 3 PM - 11 PM (8 hours)
        const afternoonStart = new Date(shiftDate);
        afternoonStart.setHours(15, 0, 0, 0);
        const afternoonEnd = new Date(shiftDate);
        afternoonEnd.setHours(23, 0, 0, 0);

        // Random staff cho afternoon shift, tránh duplicate
        let afternoonStaffId;
        attempts = 0;
        do {
          afternoonStaffId = staff[Math.floor(Math.random() * staff.length)].account_id;
          attempts++;
        } while (usedStaffAfternoon.has(afternoonStaffId) && attempts < 20);
        usedStaffAfternoon.add(afternoonStaffId);

        shifts.push({
          shift_id: uuidv4(),
          admin_id: admins[0].account_id,
          staff_id: afternoonStaffId,
          station_id: station.station_id,
          start_time: afternoonStart,
          end_time: afternoonEnd,
        });
      });
    }

    await queryInterface.bulkInsert('Shifts', shifts, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Shifts', null, {});
  }
};
