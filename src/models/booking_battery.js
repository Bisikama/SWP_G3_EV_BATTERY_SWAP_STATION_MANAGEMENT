/**
 * BOOKING_BATTERY MODEL (Join Table)
 * File: src/models/booking_battery.js
 * 
 * Sequelize model cho bảng BookingBatteries.
 * Join table cho Many-to-Many relationship giữa Booking và Battery.
 * 
 * Purpose:
 * - Lưu trữ thông tin battery nào được reserve cho booking nào
 * - Một booking có thể reserve nhiều batteries
 * - Một battery có thể được reserve bởi nhiều bookings (ở các thời điểm khác nhau)
 * 
 * Composite Primary Key: (booking_id, battery_id)
 * 
 * Relationships:
 * - belongsTo Booking
 * - belongsTo Battery
 */

'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingBattery extends Model {
    /**
     * Định nghĩa associations với các models khác.
     * Method này được gọi tự động bởi models/index.js.
     */
    static associate(models) {
      // Many-to-One relationship với Booking
      this.belongsTo(models.Booking, { 
        as: 'booking', 
        foreignKey: 'booking_id' 
      });
      
      // Many-to-One relationship với Battery
      this.belongsTo(models.Battery, { 
        as: 'battery', 
        foreignKey: 'battery_id' 
      });
    }
  }
  
  BookingBattery.init(
    {
      booking_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Bookings',
          key: 'booking_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      battery_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Batteries',
          key: 'battery_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }
    },
    {
      sequelize,
      modelName: 'BookingBattery',
      tableName: 'BookingBatteries',
      timestamps: false // Join table không cần createdAt/updatedAt
    }
  );
  
  return BookingBattery;
};
