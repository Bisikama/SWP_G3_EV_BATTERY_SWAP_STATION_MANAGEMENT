'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vehicle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.hasMany(models.SwapRecord, { as: 'swapRecords', foreignKey: 'vehicle_id' });
        this.hasMany(models.Battery, { as: 'batteries', foreignKey: 'vehicle_id' });
        this.hasOne(models.Subscription, { as: 'subscription', foreignKey: 'vehicle_id' });
        this.hasOne(models.Booking, { as: 'booking', foreignKey: 'vehicle_id' });
        this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
        this.belongsTo(models.VehicleModel, { as: 'model', foreignKey: 'model_id' });
    }
  }
  Vehicle.init({
    vehicle_id: DataTypes.UUID,
    driver_id: DataTypes.UUID,
    model_id: DataTypes.INTEGER,
    license_plate: DataTypes.STRING,
    vin: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Vehicle',
  });

  // hooks
  Vehicle.beforeSave(async (vehicle, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(vehicle.driver_id);
    if (!account || account.permission !== 'driver') {
      throw new Error('Vehicle must be associated with a driver');
    }
  });

  return Vehicle;
};