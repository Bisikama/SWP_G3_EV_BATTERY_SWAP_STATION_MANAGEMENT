'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Battery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.SwapRecord, { through: 'RetrievedSwapBattery', as: 'swapRetrievedRecords', foreignKey: 'battery_id', otherKey: 'swap_id' });
      this.belongsToMany(models.SwapRecord, { through: 'ReturnedSwapBattery', as: 'swapReturnedRecords', foreignKey: 'battery_id', otherKey: 'swap_id' });
      // transfer records: retrieved vs returned
      this.belongsToMany(models.TransferRecord, { through: 'RetrievedTransferBattery', as: 'transferRetrievedRecords', foreignKey: 'battery_id', otherKey: 'transfer_id' });
      this.belongsToMany(models.TransferRecord, { through: 'ReturnedTransferBattery', as: 'transferReturnedRecords', foreignKey: 'battery_id', otherKey: 'transfer_id' });
      // bookings
      this.belongsToMany(models.Booking, { through: 'BookingBattery', as: 'bookingRecords', foreignKey: 'battery_id', otherKey: 'booking_id' });
      this.belongsTo(models.BatteryType, { foreignKey: 'battery_type_id' });
      this.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id' });
      this.belongsTo(models.Warehouse, { foreignKey: 'warehouse_id' });
      this.belongsTo(models.CabinetSlot, { foreignKey: 'slot_id' });
    }
  }
  Battery.init({
    battery_id: DataTypes.UUID,
    battery_type_id: DataTypes.INTEGER,
    vehicle_id: DataTypes.UUID,
    warehouse_id: DataTypes.INTEGER,
    slot_id: DataTypes.INTEGER,
    battery_serial: DataTypes.STRING,
    current_soc: DataTypes.DECIMAL,
    current_soh: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'Battery',
  });

  // hooks
  Battery.beforeSave(async (battery, options) => {
    const locations = [battery.vehicle_id, battery.warehouse_id, battery.slot_id];
    const count = locations.filter(loc => loc !== null && loc !== undefined).length;

    if (count !== 1) {
      throw new Error('Battery must be assigned to exactly 1 location: vehicle, warehouse, or cabinet slot');
    }
  });

  return Battery;
};