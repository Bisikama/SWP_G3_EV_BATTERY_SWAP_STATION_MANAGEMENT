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
  BatteryType.init({
     battery_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    battery_type_name: DataTypes.STRING,
    nominal_capacity: DataTypes.DECIMAL,
    nominal_voltage: DataTypes.DECIMAL,
    energy_capacity_wh: DataTypes.DECIMAL,
    rated_power: DataTypes.DECIMAL,
    cell_chemistry: DataTypes.ENUM('Li-ion','LFP'),
    weight: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'BatteryType',
  });
  return BatteryType;
};