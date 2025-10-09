'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RetrievedTransferBattery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RetrievedTransferBattery.init({
    transfer_id: DataTypes.UUID,
    battery_id: DataTypes.UUID,
    soc: DataTypes.DECIMAL,
    soh: DataTypes.DECIMAL,
    transfer_time: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'RetrievedTransferBattery',
  });
  return RetrievedTransferBattery;
};