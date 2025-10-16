'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Accounts', {
      account_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      fullname: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      citizen_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      driving_license: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      permission: {
        type: Sequelize.ENUM('driver', 'admin', 'staff'),
        allowNull: false
      },
      reset_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reset_token_expires: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Accounts');
  }
};