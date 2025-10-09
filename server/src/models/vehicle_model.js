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
      this.hasMany(models.Vehicle, { as: 'model_id', foreignKey: 'model_id' });
      this.belongsTo(models.BatteryType, { as: 'battery_type_id', foreignKey: 'battery_type_id' });
    }
  }
  VehicleModel.init({
    model_id: DataTypes.INTEGER,
    battery_type_id: DataTypes.INTEGER,
    model_name: DataTypes.STRING,
    brand: DataTypes.STRING,
    avg_energy_consumption: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'VehicleModel',
  });
  return VehicleModel;
};