'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Warehouses', {
      warehouse_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      manager_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      warehouse_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Warehouses');
  }
};