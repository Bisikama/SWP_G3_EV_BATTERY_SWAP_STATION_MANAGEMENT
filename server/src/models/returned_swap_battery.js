'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReturnedSwapBattery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.SwapRecord, { foreignKey: 'swap_id', as: 'swap' });
      this.belongsTo(models.Battery, { foreignKey: 'battery_id', as: 'battery' });
    }
  }
  ReturnedSwapBattery.init(
    {
      swap_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'SwapRecords',
          key: 'swap_id'
        }
      },
      battery_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Batteries',
          key: 'battery_id'
        }
      },
      soc: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      soh: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      swap_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'ReturnedSwapBattery',
      tableName: 'ReturnedSwapBatteries',
      timestamps: false
    }
  );
  return ReturnedSwapBattery;
};