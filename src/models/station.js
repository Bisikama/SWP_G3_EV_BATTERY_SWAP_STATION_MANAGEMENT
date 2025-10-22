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
      this.hasMany(models.TransferDetail, { as: 'transferDetails', foreignKey: 'station_id' });
      this.hasMany(models.TransferRequest, { as: 'transferRequests', foreignKey: 'station_id' });
    }
  }
  Station.init(
    {
      station_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      station_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('operational', 'maintenance', 'closed'),
        allowNull: false,
        defaultValue: 'operational'
      }
    },
    {
      sequelize,
      modelName: 'Station',
      tableName: 'Stations',
      timestamps: false
    }
  );
  return Station;
};