'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RetrievedSwapBattery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RetrievedSwapBattery.init({
    swap_id: DataTypes.UUID,
    battery_id: DataTypes.UUID,
    soc: DataTypes.DECIMAL,
    soh: DataTypes.DECIMAL,
    swap_time: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'RetrievedSwapBattery',
  });
  return RetrievedSwapBattery;
};