'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingBattery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // BookingBattery belongs to Booking
      this.belongsTo(models.Booking, { 
        as: 'booking', 
        foreignKey: 'booking_id' 
      });
      
      // BookingBattery belongs to Battery
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
      timestamps: false // Bảng join không cần timestamps
    }
  );
  
  return BookingBattery;
};
