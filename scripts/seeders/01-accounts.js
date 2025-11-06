'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const accounts = [];

    // Admins - 2 accounts
    accounts.push(
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'John Admin',
        phone_number: '+84901234567',
        email: 'john.admin@evswap.com',
        status: 'active',
        role: 'admin'
      },
      {
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: 'Sarah Administrator',
        phone_number: '+84901234568',
        email: 'sarah.admin@evswap.com',
        status: 'active',
        role: 'admin'
      }
    );

    // Staff - 10 accounts
    const staffNames = [
      { fullname: 'Tom Staff', email: 'tom.staff@evswap.com' },
      { fullname: 'Anna Technician', email: 'anna.staff@evswap.com' },
      { fullname: 'Kevin Support', email: 'kevin.staff@evswap.com' },
      { fullname: 'Lisa Operator', email: 'lisa.staff@evswap.com' },
      { fullname: 'Mark Service', email: 'mark.staff@evswap.com' },
      { fullname: 'Jenny Assistant', email: 'jenny.staff@evswap.com' },
      { fullname: 'David Maintenance', email: 'david.staff@evswap.com' },
      { fullname: 'Rachel Coordinator', email: 'rachel.staff@evswap.com' },
      { fullname: 'Peter Engineer', email: 'peter.staff@evswap.com' },
      { fullname: 'Sophie Specialist', email: 'sophie.staff@evswap.com' }
    ];

    staffNames.forEach((staff, index) => {
      accounts.push({
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: staff.fullname,
        phone_number: `+8490123457${index + 1}`,
        email: staff.email,
        status: 'active',
        role: 'staff'
      });
    });

    // Drivers - 50 accounts
    const firstNames = [
      'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Do', 'Ngo', 'Dang', 'Bui',
      'Duong', 'Ly', 'Vo', 'Truong', 'Phan', 'Dinh', 'Ha', 'Dao', 'Luong', 'Lam'
    ];
    const middleNames = ['Van', 'Thi', 'Minh', 'Hoang', 'Thanh', 'Anh', 'Duc', 'Hai', 'Huu', 'Tuan'];
    const lastNames = [
      'An', 'Binh', 'Cuong', 'Dung', 'Em', 'Giang', 'Hung', 'Khanh', 'Long', 'Mai',
      'Nam', 'Oanh', 'Phuc', 'Quang', 'Son', 'Tung', 'Uyen', 'Vy', 'Xuan', 'Yen'
    ];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const middleName = middleNames[Math.floor(i / 5) % middleNames.length];
      const lastName = lastNames[i % lastNames.length];
      
      accounts.push({
        account_id: uuidv4(),
        password_hash: hashedPassword,
        fullname: `${firstName} ${middleName} ${lastName}`,
        phone_number: `+849${String(10000000 + i).substring(1)}`,
        email: `driver${i + 1}@gmail.com`,
        status: 'active',
        role: 'driver'
      });
    }

    await queryInterface.bulkInsert('Accounts', accounts, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Accounts', null, {});
  }
};
