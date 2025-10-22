'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CabinetSlots', {
      slot_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      cabinet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Cabinets',
          key: 'cabinet_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      slot_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      voltage: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      current: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      status: {
        type: Sequelize.ENUM('empty', 'locked', 'charging', 'charged', 'faulty'),
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CabinetSlots');
  }
};