'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE role = 'driver' ORDER BY email`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const models = await queryInterface.sequelize.query(
      `SELECT model_id, name FROM "VehicleModels"`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (drivers.length === 0 || models.length === 0) {
      console.log('No drivers or models found, skipping vehicles seeder');
      return;
    }

    const byName = models.reduce((acc, m) => {
      acc[m.name] = m.model_id;
      return acc;
    }, {});

    // Frontend-required VDS codes
    const modelVdsMap = {
      'Ludo': 'LUD',
      'Impes': 'IMP',
      'Klara S': 'KLA',
      'Theon S': 'TES',
      'Vento': 'VEN',
      'Theon': 'THE',
      'Vento S': 'VES',
      'Feliz S': 'FEL',
      'Evo200': 'EVO',
    };

    const vehicles = [];

    // Valid province codes (avoiding excluded list)
    const validProvinces = [
      '11','12','14','15','16','17','18','19','20','21','22','23','24','25',
      '26','27','28','29','30','31','32','33','34','35','36','37','38','39',
      '40','41','43','47','48','49','50','51','52','53','54','55','56','57',
      '58','59','60','61','62','63','64','65','66','67','68','69','70','71',
      '72','73','74','75','76','77','78','79','80','81','82','83','84','85',
      '86','88','89','90','92','93','94','95','97','98','99'
    ];

    const letters = 'ABCDEFGHJKLMNPRSTUVXYZ';

    for (let i = 0; i < drivers.length && i < 50; i++) {
      const modelNames = Object.keys(byName);
      const modelName = modelNames[i % modelNames.length];
      const modelId = byName[modelName];

      const vds = modelVdsMap[modelName] ?? 'XXX'; // fallback
      const province = validProvinces[i % validProvinces.length];
      const series = letters[i % letters.length];
      const numbers = String(1000 + i).padStart(4, '0'); // 4–5 digits OK

      const vis = (uuidv4().replace(/-/g, '').substring(0, 11).toUpperCase());

      const vin = `RL9${vds}${vis}`;

      vehicles.push({
        vehicle_id: uuidv4(),
        driver_id: drivers[i].account_id,
        model_id: modelId,
        license_plate: `${province}${series}-${numbers}`,
        vin
      });
    }

    // -------------------------
    //  Add 100 inactive vehicles
    // -------------------------
    for (let i = 0; i < 100; i++) {
      const modelNames = Object.keys(byName);
      const modelName = modelNames[i % modelNames.length];
      const modelId = byName[modelName];

      const vds = modelVdsMap[modelName] ?? 'XXX';

      // Valid license plate values
      const province = validProvinces[i % validProvinces.length];
      const series = letters[i % letters.length];
      const numbers = String(2000 + i).padStart(4, '0');

      // VIN = RL9 + VDS + 11-char VIS
      const vis = uuidv4().replace(/-/g, '').substring(0, 11).toUpperCase();
      const vin = `RL9${vds}${vis}`;

      vehicles.push({
        vehicle_id: uuidv4(),
        driver_id: null,
        model_id: modelId,
        license_plate: `${province}${series}-${numbers}`,
        vin,
      });
    }

    await queryInterface.bulkInsert('Vehicles', vehicles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Vehicles', null, {});
  }
};
