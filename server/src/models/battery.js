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
      this.belongsToMany(models.SwapRecord, { through: 'RetrievedSwapBattery', as: 'retrieved_battery_id', foreignKey: 'battery_id', otherKey: 'swap_id' });
      this.belongsToMany(models.SwapRecord, { through: 'ReturnedSwapBattery', as: 'returned_battery_id', foreignKey: 'battery_id', otherKey: 'swap_id' });
      this.belongsToMany(models.TransferRecord, { through: 'RetrievedTransferBattery', as: 'retrieved_battery_id', foreignKey: 'battery_id', otherKey: 'transfer_id' });
      this.belongsToMany(models.TransferRecord, { through: 'ReturnedTransferBattery', as: 'returned_battery_id', foreignKey: 'battery_id', otherKey: 'transfer_id' });
      this.belongsToMany(models.Booking, { through: 'BookingBattery', as: 'battery_id', foreignKey: 'battery_id', otherKey: 'booking_id' });
      this.belongsTo(models.BatteryType, { as: 'battery_type_id', foreignKey: 'battery_type_id' });
      this.belongsTo(models.Vehicle, { as: 'vehicle_id', foreignKey: 'vehicle_id' });
      this.belongsTo(models.Warehouse, { as: 'warehouse_id', foreignKey: 'warehouse_id' });
      this.belongsTo(models.CabinetSlot, { as: 'slot_id', foreignKey: 'slot_id' });
    }
  }
  Battery.init({
    battery_id: DataTypes.UUID,
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