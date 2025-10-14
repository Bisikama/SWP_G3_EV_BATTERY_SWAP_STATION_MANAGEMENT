'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SwapRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.belongsToMany(models.Battery, { through: 'RetrievedSwapBattery', as: 'retrievedBatteries', foreignKey: 'swap_id', otherKey: 'battery_id' });
        this.belongsToMany(models.Battery, { through: 'ReturnedSwapBattery', as: 'returnedBatteries', foreignKey: 'swap_id', otherKey: 'battery_id' });
        this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
        this.belongsTo(models.Vehicle, { as: 'vehicle', foreignKey: 'vehicle_id' });
        this.belongsTo(models.Station, { as: 'station', foreignKey: 'station_id' });
    }
  }
  SwapRecord.init(
    {
      swap_id: {
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
      }
    },
    {
      sequelize,
      modelName: 'SwapRecord',
      tableName: 'SwapRecords',
      timestamps: false
    }
  );

  SwapRecord.beforeSave(async (swap, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(swap.swap_by);
    if (!account || account.permission !== 'driver') {
      throw new Error('Swap record must be associated with a driver');
    }
  });

  return SwapRecord;
};