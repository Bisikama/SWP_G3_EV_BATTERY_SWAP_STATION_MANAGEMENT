'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SwapRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Battery, { through: 'RetrievedSwapBattery', as: 'retrieved_swap_id', foreignKey: 'swap_id', otherKey: 'battery_id' });
      this.belongsToMany(models.Battery, { through: 'ReturnedSwapBattery', as: 'returned_swap_id', foreignKey: 'swap_id', otherKey: 'battery_id' });
      this.belongsTo(models.Account, { as: 'driver_id', foreignKey: 'driver_id' });
      this.belongsTo(models.Vehicle, { as: 'vehicle_id', foreignKey: 'vehicle_id' });
      this.belongsTo(models.Station, { as: 'station_id', foreignKey: 'station_id' });
    }
  }
  SwapRecord.init({
    swap_id: DataTypes.UUID,
    driver_id: DataTypes.UUID,
    vehicle_id: DataTypes.UUID,
    station_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SwapRecord',
  });

  SwapRecord.beforeSave(async (swap, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(swap.swap_by);
    if (!account || account.permission !== 'driver') {
      throw new Error('Swap record must be associated with a driver');
    }
  });

  return SwapRecord;
};