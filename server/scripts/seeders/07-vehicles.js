// seeders/07-vehicles.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'driver'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const vehicles = [
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[0].account_id,
        model_id: 1,
        license_plate: '51A-12345',
        vin: '5YJ3E1EA1KF000001'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[1].account_id,
        model_id: 3,
        license_plate: '51B-67890',
        vin: '1N4AZ1CP0KC000002'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[2].account_id,
        model_id: 2,
        license_plate: '51C-11111',
        vin: '5YJ3E1EB2KF000003'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[3].account_id,
        model_id: 4,
        license_plate: '51D-22222',
        vin: 'WVGBV7AX0MW000004'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[4].account_id,
        model_id: 6,
        license_plate: '51E-33333',
        vin: 'KM8K53AG0LU000005'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[5].account_id,
        model_id: 7,
        license_plate: '51F-44444',
        vin: 'LVVDB1DK5NP000006'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[6].account_id,
        model_id: 1,
        license_plate: '51G-55555',
        vin: '5YJ3E1EA3KF000007'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[7].account_id,
        model_id: 5,
        license_plate: '51H-66666',
        vin: 'WVWKP7AU9GW000008'
      }
    ];

    await queryInterface.bulkInsert('Vehicles', vehicles);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Vehicles', null, {});
  }
};
