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
      // define association here
    }
  }
  BookingBattery.init({
    booking_id: DataTypes.UUID,
    battery_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'BookingBattery',
  });
  return BookingBattery;
};