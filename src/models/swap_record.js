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
        this.belongsTo(models.Battery, { as: 'returnedBattery', foreignKey: 'battery_id_in' });
        this.belongsTo(models.Battery, { as: 'retrievedBattery', foreignKey: 'battery_id_out' });
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
      },
      battery_id_in: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Batteries',
          key: 'battery_id'
        }
      },
      battery_id_out: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Batteries',
          key: 'battery_id'
        }
      },
      soh_in: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0 }
      },
      soh_out: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: { min: 0 }
      },
      swap_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
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
    const account = await Account.findByPk(swap.driver_id);
    if (!account || account.role !== 'driver') {
      throw new Error('Swap record must be associated with a driver');
    }
  });

  return SwapRecord;
};