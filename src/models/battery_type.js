'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BatteryType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Battery, { as: 'batteries', foreignKey: 'battery_type_id' });
      this.hasMany(models.VehicleModel, { as: 'vehicleModels', foreignKey: 'battery_type_id' });
    }
  }
  BatteryType.init(
    {
      battery_type_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      battery_type_code: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      nominal_capacity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      nominal_voltage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      min_voltage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      max_voltage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      rated_charge_current: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      cell_chemistry: {
        type: DataTypes.ENUM('Li-ion', 'LFP'),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'BatteryType',
      tableName: 'BatteryTypes',
      timestamps: false
    }
  );
  return BatteryType;
};