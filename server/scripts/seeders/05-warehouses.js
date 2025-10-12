// seeders/05-warehouses.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get manager accounts
    const managers = await queryInterface.sequelize.query(
      `SELECT account_id FROM "Accounts" WHERE permission = 'manager' LIMIT 2`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('Warehouses', [
      {
        warehouse_id: 1,
        manager_id: managers[0].account_id,
        warehouse_name: 'Central Battery Warehouse',
        address: '999 Nguyen Van Linh, District 7, HCMC',
        capacity: 500,
        stock: 320
      },
      {
        warehouse_id: 2,
        manager_id: managers[1].account_id,
        warehouse_name: 'North Battery Depot',
        address: '555 Pham Van Dong, Thu Duc, HCMC',
        capacity: 300,
        stock: 180
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Warehouses', null, {});
  }
};
