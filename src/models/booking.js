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
        // Many-to-Many with Battery through BookingBattery
        this.belongsToMany(models.Battery, { 
          through: models.BookingBattery, 
          as: 'batteries', 
          foreignKey: 'booking_id', 
          otherKey: 'battery_id' 
        });
        
        // Many BookingBattery records
        this.hasMany(models.BookingBattery, { 
          as: 'bookingBatteries', 
          foreignKey: 'booking_id' 
        });
        
        this.belongsTo(models.Station, { as: 'station', foreignKey: 'station_id' });
        this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
        this.belongsTo(models.Vehicle, { as: 'vehicle', foreignKey: 'vehicle_id' });
    }
  }
  Booking.init(
    {
      booking_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      driver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      vehicle_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Vehicles',
          key: 'vehicle_id'
        }
      },
      station_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'station_id'
        }
      },
      create_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      scheduled_time: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Scheduled start time for battery swap'
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      }
    },
    {
      sequelize,
      modelName: 'Booking',
      tableName: 'Bookings',
      timestamps: false
    }
  );

  // hooks
  Booking.beforeSave(async (booking, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(booking.driver_id);
    if (!account || account.role !== 'driver') {
      throw new Error('Booking must be associated with a driver');
    }
  });

  return Booking;
};