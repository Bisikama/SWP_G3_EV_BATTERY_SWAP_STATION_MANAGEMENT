'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReturnedTransferBattery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ReturnedTransferBattery.init({
    transfer_id: DataTypes.UUID,
    battery_id: DataTypes.UUID,
    soc: DataTypes.DECIMAL,
    soh: DataTypes.DECIMAL,
    transfer_time: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ReturnedTransferBattery',
  });
  return ReturnedTransferBattery;
};