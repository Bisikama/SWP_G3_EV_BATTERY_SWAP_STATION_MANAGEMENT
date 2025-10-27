'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vehicles', {
      vehicle_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      driver_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      model_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'VehicleModels',
          key: 'model_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      license_plate: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      vin: {
        type: Sequelize.STRING(17),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      }
      
    });
  },
  
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Vehicles');
  }
};