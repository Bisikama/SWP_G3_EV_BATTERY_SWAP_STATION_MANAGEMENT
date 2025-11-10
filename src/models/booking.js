/**
 * BOOKING MODEL
 * File: src/models/booking.js
 * 
 * Sequelize model cho bảng Bookings.
 * Đại diện cho một booking (đặt chỗ swap pin) của driver tại một station.
 * 
 * Relationships:
 * - belongsTo Account (driver) - Booking được tạo bởi driver
 * - belongsTo Vehicle - Booking cho một vehicle cụ thể
 * - belongsTo Station - Booking tại một station
 * - belongsToMany Battery through BookingBattery - Batteries được reserve cho booking này
 * 
 * Business Rules:
 * - Driver chỉ có thể có tối đa 1 booking pending tại một thời điểm
 * - Booking tự động expired sau khoảng thời gian định trước (system config)
 * - Expired bookings sẽ tự động cancelled bởi cron job
 */

'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Định nghĩa associations với các models khác.
     * Method này được gọi tự động bởi models/index.js.
     */
    static associate(models) {
        // Many-to-Many relationship với Battery thông qua BookingBattery
        this.belongsToMany(models.Battery, { 
          through: models.BookingBattery, 
          as: 'batteries', 
          foreignKey: 'booking_id', 
          otherKey: 'battery_id' 
        });
        
        // One-to-Many relationship với BookingBattery
        this.hasMany(models.BookingBattery, { 
          as: 'bookingBatteries', 
          foreignKey: 'booking_id' 
        });
        
        // Many-to-One relationships
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
      expired_time: {
        type: DataTypes.DATE,
        allowNull: false,
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

  /**
   * Sequelize hooks
   * 
   * beforeSave hook: Validate driver_id phải là một account có role driver.
   * Đảm bảo chỉ drivers mới có thể tạo bookings.
   */
  Booking.beforeSave(async (booking, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(booking.driver_id);
    if (!account || account.role !== 'driver') {
      throw new Error('Booking must be associated with a driver');
    }
  });

  return Booking;
};