// seeders/14-shifts.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'admin'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const staff = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'staff'`,
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

      stations.forEach((station, stationIndex) => {
        // Morning shift: 6 AM - 2 PM
        shifts.push({
          shift_id: uuidv4(),
          admin_id: admins[0].account_id,
          staff_id: staff[stationIndex % staff.length].account_id,
          station_id: station.station_id,
          start_time: new Date(shiftDate.setHours(6, 0, 0)),
          end_time: new Date(shiftDate.setHours(14, 0, 0)),
          status: day === 0 ? 'confirmed' : 'assigned'
        });

        // Afternoon shift: 2 PM - 10 PM
        shifts.push({
          shift_id: uuidv4(),
          admin_id: admins[0].account_id,
          staff_id: staff[(stationIndex + 1) % staff.length].account_id,
          station_id: station.station_id,
          start_time: new Date(shiftDate.setHours(14, 0, 0)),
          end_time: new Date(shiftDate.setHours(22, 0, 0)),
          status: day === 0 ? 'confirmed' : 'assigned'
        });
      });
    }

    await queryInterface.bulkInsert('Shifts', shifts);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Shifts', null, {});
  }
};
