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
      this.hasMany(models.Booking, { as: 'station_id', foreignKey: 'station_id' });
      this.hasMany(models.Cabinet, { as: 'station_id', foreignKey: 'station_id' });
      this.hasMany(models.Shift, { as: 'station_id', foreignKey: 'station_id' });
      this.hasMany(models.SwapRecord, { as: 'station_id', foreignKey: 'station_id' });
      this.hasMany(models.TransferRecord, { as: 'station_id', foreignKey: 'station_id' });
    }
  }
  Station.init({
    station_id: DataTypes.INTEGER,
    station_name: DataTypes.STRING,
    address: DataTypes.STRING,
    latitude: DataTypes.DECIMAL,
    longitude: DataTypes.DECIMAL,
    status: DataTypes.ENUM
  }, {
    sequelize,
    modelName: 'Station',
  });
  return Station;
};