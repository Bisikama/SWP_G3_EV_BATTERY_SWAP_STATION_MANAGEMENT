'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Station extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
  this.hasMany(models.Booking, { as: 'bookings', foreignKey: 'station_id' });
  this.hasMany(models.Cabinet, { as: 'cabinets', foreignKey: 'station_id' });
  this.hasMany(models.Shift, { as: 'shifts', foreignKey: 'station_id' });
  this.hasMany(models.SwapRecord, { as: 'swapRecords', foreignKey: 'station_id' });
  this.hasMany(models.TransferRecord, { as: 'transferRecords', foreignKey: 'station_id' });
    }
  }
  Station.init({
    station_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    station_name: DataTypes.STRING,
    address: DataTypes.STRING,
    latitude: DataTypes.DECIMAL,
    longitude: DataTypes.DECIMAL,
    status: DataTypes.ENUM('operational', 'maintenance', 'closed')
  }, {
    sequelize,
    modelName: 'Station',
  });
  return Station;
};