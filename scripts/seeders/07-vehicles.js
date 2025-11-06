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

    const byName = models.reduce((acc, m) => { acc[m.name] = m.model_id; return acc; }, {});
    
    // Danh sách các model names
    const modelNames = Object.keys(byName);
    
    // Tạo 50 vehicles cho 50 drivers
    const vehicles = [];
    const licensePlateProvinces = ['51', '59', '50', '60', '61', '63', '64', '65', '67', '68'];
    const licensePlateLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'S', 'T', 'V', 'X', 'Y', 'Z'];
    
    for (let i = 0; i < drivers.length && i < 50; i++) {
      const province = licensePlateProvinces[i % licensePlateProvinces.length];
      const letter = licensePlateLetters[Math.floor(i / licensePlateProvinces.length) % licensePlateLetters.length];
      const numbers = String(10000 + i).substring(0, 5);
      
      const modelName = modelNames[i % modelNames.length];
      const modelId = byName[modelName];
      
      // Generate VIN (Vehicle Identification Number) - max 17 chars
      const vinPrefix = modelName.substring(0, 3).toUpperCase().padEnd(3, 'X');
      const vinNumber = String(100000 + i).substring(1); // 5 digits
      
      vehicles.push({
        vehicle_id: uuidv4(),
        driver_id: drivers[i].account_id,
        model_id: modelId,
        license_plate: `${province}${letter}-${numbers}`,
        vin: `VF9${vinPrefix}${String.fromCharCode(65 + (i % 26))}${vinNumber}` // VF9 + 3 + 1 + 5 = 12 chars
      });
    }

    await queryInterface.bulkInsert('Vehicles', vehicles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Vehicles', null, {});
  }
};
