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
      this.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
      this.belongsTo(models.Battery, { foreignKey: 'battery_id', as: 'battery' });
    }
  }
  BookingBattery.init(
    {
      booking_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Bookings',
          key: 'booking_id'
        }
      },
      battery_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Batteries',
          key: 'battery_id'
        }
      }
    },
    {
      sequelize,
      modelName: 'BookingBattery',
      tableName: 'BookingBatteries',
      timestamps: false
    }
  );
  return BookingBattery;
};