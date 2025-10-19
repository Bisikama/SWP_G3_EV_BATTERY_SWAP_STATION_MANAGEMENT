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
      this.belongsToMany(models.Transfer, { through: 'RetrievedTransferBattery', as: 'transferRetrievedRecords', foreignKey: 'battery_id', otherKey: 'transfer_id' });
      this.belongsToMany(models.Transfer, { through: 'ReturnedTransferBattery', as: 'transferReturnedRecords', foreignKey: 'battery_id', otherKey: 'transfer_id' });
      this.belongsToMany(models.Booking, { through: 'BookingBattery', as: 'bookingRecords', foreignKey: 'battery_id', otherKey: 'booking_id' });
      this.belongsTo(models.BatteryType, { as: 'batteryType', foreignKey: 'battery_type_id' });
      this.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id' });
      this.belongsTo(models.CabinetSlot, { as: 'cabinetSlot', foreignKey: 'slot_id' });
    }
  }
  Battery.init(
    {
      battery_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      battery_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'BatteryTypes',
          key: 'battery_type_id'
        }
      },
      vehicle_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Vehicles',
          key: 'vehicle_id'
        }
      },
      slot_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'CabinetSlots',
          key: 'slot_id'
        }
      },
      battery_serial: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      current_soc: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      current_soh: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      }
    },
    {
      sequelize,
      modelName: 'Battery',
      tableName: 'Batteries',
      timestamps: false
    }
  );

  // hooks
  // Battery.beforeSave(async (battery, options) => {
  //   const locations = [battery.vehicle_id, battery.slot_id];
  //   const count = locations.filter(loc => loc !== null && loc !== undefined).length;

  //   if (count !== 1) {
  //     throw new Error('Battery must be assigned to exactly 1 location: vehicle, or cabinet slot');
  //   }
  // });

  return Battery;
};