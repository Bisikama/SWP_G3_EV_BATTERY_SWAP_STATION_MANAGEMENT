'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransferOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.belongsToMany(models.Battery, { through: 'TransferBatteryOrders', as: 'batteries', foreignKey: 'transfer_order_id', otherKey: 'battery_id' })
        this.belongsTo(models.TransferRequest, { as: 'transferRequest', foreignKey: 'transfer_request_id' });
        this.belongsTo(models.Account, { as: 'staff', foreignKey: 'staff_id' });
        this.belongsTo(models.Station, { as: 'sourceStation', foreignKey: 'source_station_id' });
        this.belongsTo(models.Station, { as: 'targetStation', foreignKey: 'target_station_id' });
    }
  }
  TransferOrder.init(
    {
      transfer_order_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      transfer_request_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'TransferRequests',
          key: 'transfer_request_id'
        }
      },
      source_station_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'station_id'
        }
      },
      target_station_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'station_id'
        }
      },
      staff_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      confirm_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      transfer_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM(
          'incompleted',
          'completed'
        ),
        allowNull: false,
        defaultValue: 'incompleted'
      }
    },
    {
      sequelize,
      modelName: 'TransferOrder',
      tableName: 'TransferOrders',
      timestamps: false
    }
  );
  
  return TransferOrder;
};