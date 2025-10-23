'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE role = 'driver'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const models = await queryInterface.sequelize.query(
      `SELECT model_id, name FROM "VehicleModels"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const byName = models.reduce((acc, m) => { acc[m.name] = m.model_id; return acc; }, {});

    const vehicles = [
      { vehicle_id: uuidv4(), driver_id: drivers[0].account_id, model_id: byName['Ludo'], license_plate: '51A-12345', vin: 'VF9LUDO00A0000017' },
      { vehicle_id: uuidv4(), driver_id: drivers[1].account_id, model_id: byName['Impes'], license_plate: '51B-67890', vin: 'VF9IMPE00B0000027' },
      { vehicle_id: uuidv4(), driver_id: drivers[2].account_id, model_id: byName['Klara S'], license_plate: '51C-11111', vin: 'VF9KLAR00C0000037' },
      { vehicle_id: uuidv4(), driver_id: drivers[3].account_id, model_id: byName['Theon'], license_plate: '51D-22222', vin: 'VF9THEO00D0000047' },
      { vehicle_id: uuidv4(), driver_id: drivers[4].account_id, model_id: byName['Vento'], license_plate: '51E-33333', vin: 'VF9VENT00E0000057' },
      { vehicle_id: uuidv4(), driver_id: drivers[5].account_id, model_id: byName['Theon S'], license_plate: '51F-44444', vin: 'VF9THES00F0000067' },
      { vehicle_id: uuidv4(), driver_id: drivers[6].account_id, model_id: byName['Vento S'], license_plate: '51G-55555', vin: 'VF9VENS00G0000077' },
      { vehicle_id: uuidv4(), driver_id: drivers[7].account_id, model_id: byName['Feliz S'], license_plate: '51H-66666', vin: 'VF9FELS00H0000087' }
    ];

    await queryInterface.bulkInsert('Vehicles', vehicles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Vehicles', null, {});
  }
};
