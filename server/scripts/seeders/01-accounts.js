// seeders/01-accounts.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const accounts = [
      // Admins
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'John Admin',
        phone_number: '+84901234567',
        email: 'john.admin@evswap.com',
        status: 'active',
        permission: 'admin'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Sarah Administrator',
        phone_number: '+84901234568',
        email: 'sarah.admin@evswap.com',
        status: 'active',
        permission: 'admin'
      },
      
      // Staff
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Tom Staff',
        phone_number: '+84901234571',
        email: 'tom.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Anna Technician',
        phone_number: '+84901234572',
        email: 'anna.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Kevin Support',
        phone_number: '+84901234573',
        email: 'kevin.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      
      // Drivers
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Nguyen Van A',
        phone_number: '+84912345678',
        email: 'nguyen.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Tran Thi B',
        phone_number: '+84912345679',
        email: 'tran.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Le Van C',
        phone_number: '+84912345680',
        email: 'le.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Pham Thi D',
        phone_number: '+84912345681',
        email: 'pham.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Hoang Van E',
        phone_number: '+84912345682',
        email: 'hoang.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Vu Thi F',
        phone_number: '+84912345683',
        email: 'vu.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Do Van G',
        phone_number: '+84912345684',
        email: 'do.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Ngo Thi H',
        phone_number: '+84912345685',
        email: 'ngo.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      }
    ];

    await queryInterface.bulkInsert('Accounts', accounts);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Accounts', null, {});
  }
};
