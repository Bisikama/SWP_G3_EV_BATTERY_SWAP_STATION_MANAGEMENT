'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CabinetSlot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.Battery, { as: 'battery', foreignKey: 'slot_id' });
      this.belongsTo(models.Cabinet, { as: 'cabinet', foreignKey: 'cabinet_id' });
    }
  }
  CabinetSlot.init(
    {
      slot_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      cabinet_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Cabinets',
          key: 'cabinet_id'
        }
      },
      slot_number: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      voltage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      current: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      status: {
        type: DataTypes.ENUM('empty', 'charging', 'charged', 'faulty'),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'CabinetSlot',
      tableName: 'CabinetSlots',
      timestamps: false
    }
  );
  return CabinetSlot;
};