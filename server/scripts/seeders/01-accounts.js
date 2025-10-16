// seeders/01-accounts.js
'use strict';
const bcrypt = require('bcrypt');
const db = require('../../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const accounts = [
      // Admins
      {
        password_hash: hashedPassword,
        fullname: 'John Admin',
        phone_number: '+84901234567',
        email: 'john.admin@evswap.com',
        status: 'active',
        permission: 'admin'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Sarah Administrator',
        phone_number: '+84901234568',
        email: 'sarah.admin@evswap.com',
        status: 'active',
        permission: 'admin'
      },
      
      // Staff
      {
        password_hash: hashedPassword,
        fullname: 'Tom Staff',
        phone_number: '+84901234571',
        email: 'tom.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Anna Technician',
        phone_number: '+84901234572',
        email: 'anna.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Kevin Support',
        phone_number: '+84901234573',
        email: 'kevin.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      
      // Drivers
      {
        password_hash: hashedPassword,
        fullname: 'Nguyen Van A',
        phone_number: '+84912345678',
        email: 'nguyen.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Tran Thi B',
        phone_number: '+84912345679',
        email: 'tran.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Le Van C',
        phone_number: '+84912345680',
        email: 'le.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Pham Thi D',
        phone_number: '+84912345681',
        email: 'pham.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Hoang Van E',
        phone_number: '+84912345682',
        email: 'hoang.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Vu Thi F',
        phone_number: '+84912345683',
        email: 'vu.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Do Van G',
        phone_number: '+84912345684',
        email: 'do.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        password_hash: hashedPassword,
        fullname: 'Ngo Thi H',
        phone_number: '+84912345685',
        email: 'ngo.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      }
    ];

  await db.Account.bulkCreate(accounts, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Accounts', null, {});
  }
};
