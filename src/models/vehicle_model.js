'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VehicleModel extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Vehicle, { as: 'vehicles', foreignKey: 'model_id' });
      this.belongsTo(models.BatteryType, { as: 'batteryType', foreignKey: 'battery_type_id' });
    }
  }
  VehicleModel.init(
    {
      model_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      battery_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'BatteryTypes',
          key: 'battery_type_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      brand: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      avg_energy_usage: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      }
    },
    {
      sequelize,
      modelName: 'VehicleModel',
      tableName: 'VehicleModels',
      timestamps: false
    }
  );
  return VehicleModel;
};