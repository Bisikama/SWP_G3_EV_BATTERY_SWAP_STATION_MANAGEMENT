'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReturnedTransferBattery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Transfer, { foreignKey: 'transfer_id', as: 'transfer' });
      this.belongsTo(models.Battery, { foreignKey: 'battery_id', as: 'battery' });
    }
  }
  ReturnedTransferBattery.init(
    {
      transfer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Transfers',
          key: 'transfer_id'
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
      transfer_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'ReturnedTransferBattery',
      tableName: 'ReturnedTransferBatteries',
      timestamps: false
    }
  );
  return ReturnedTransferBattery;
};