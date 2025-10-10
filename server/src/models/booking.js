'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.belongsToMany(models.Battery, { through: 'BookingBattery', as: 'batteries', foreignKey: 'booking_id', otherKey: 'battery_id' });
        this.belongsTo(models.Station, { as: 'station', foreignKey: 'station_id' });
        this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
        this.belongsTo(models.Vehicle, { as: 'vehicle', foreignKey: 'vehicle_id' });
    }
  }
  Booking.init({
    booking_id: DataTypes.UUID,
    driver_id: DataTypes.UUID,
    vehicle_id: DataTypes.UUID,
    station_id: DataTypes.INTEGER,
    booking_time: DataTypes.DATE,
    scheduled_start_time: DataTypes.DATE,
    scheduled_end_time: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Booking',
  });

  // hooks
  Booking.beforeSave(async (booking, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(booking.driver_id);
    if (!account || account.permission !== 'driver') {
      throw new Error('Booking must be associated with a driver');
    }
  });

  return Booking;
};