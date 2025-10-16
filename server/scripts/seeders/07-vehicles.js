// seeders/07-vehicles.js
'use strict';
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'driver'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Resolve vehicle model ids by model name to avoid hardcoded numeric IDs
    const models = await queryInterface.sequelize.query(
      `SELECT model_id, name FROM "VehicleModels"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byName = models.reduce((acc, m) => { acc[m.name] = m.model_id; return acc; }, {});

    const vehicles = [
      {
        driver_id: drivers[0].account_id,
        model_id: byName['Model 3'],
        license_plate: '51A-12345',
        vin: '5YJ3E1EA1KF000001'
      },
      {
        driver_id: drivers[1].account_id,
        model_id: byName['VF8'],
        license_plate: '51B-67890',
        vin: '1N4AZ1CP0KC000002'
      },
      {
        driver_id: drivers[2].account_id,
        model_id: byName['Model Y'],
        license_plate: '51C-11111',
        vin: '5YJ3E1EB2KF000003'
      },
      {
        driver_id: drivers[3].account_id,
        model_id: byName['ID.4'],
        license_plate: '51D-22222',
        vin: 'WVGBV7AX0MW000004'
      },
      {
        driver_id: drivers[4].account_id,
        model_id: byName['Kona Electric'],
        license_plate: '51E-33333',
        vin: 'KM8K53AG0LU000005'
      },
      {
        driver_id: drivers[5].account_id,
        model_id: byName['VF8'],
        license_plate: '51F-44444',
        vin: 'LVVDB1DK5NP000006'
      },
      {
        driver_id: drivers[6].account_id,
        model_id: byName['Model 3'],
        license_plate: '51G-55555',
        vin: '5YJ3E1EA3KF000007'
      },
      {
        driver_id: drivers[7].account_id,
        model_id: byName['e-Golf'],
        license_plate: '51H-66666',
        vin: 'WVWKP7AU9GW000008'
      }
    ];

    await db.Vehicle.bulkCreate(vehicles, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Vehicles', null, {});
  }
};
