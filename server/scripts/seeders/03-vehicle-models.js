// seeders/03-vehicle-models.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('VehicleModels', [
      {
        model_id: 1,
        battery_type_id: 1,
        name: 'Model 3',
        brand: 'Tesla',
        avg_energy_usage: 15.50
      },
      {
        model_id: 2,
        battery_type_id: 2,
        name: 'Model Y',
        brand: 'Tesla',
        avg_energy_usage: 17.20
      },
      {
        model_id: 3,
        battery_type_id: 3,
        name: 'Leaf',
        brand: 'Nissan',
        avg_energy_usage: 16.80
      },
      {
        model_id: 4,
        battery_type_id: 2,
        name: 'ID.4',
        brand: 'Volkswagen',
        avg_energy_usage: 18.00
      },
      {
        model_id: 5,
        battery_type_id: 4,
        name: 'e-Golf',
        brand: 'Volkswagen',
        avg_energy_usage: 14.50
      },
      {
        model_id: 6,
        battery_type_id: 1,
        name: 'Kona Electric',
        brand: 'Hyundai',
        avg_energy_usage: 15.00
      },
      {
        model_id: 7,
        battery_type_id: 3,
        name: 'VF8',
        brand: 'VinFast',
        avg_energy_usage: 16.50
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('VehicleModels', null, {});
  }
};
