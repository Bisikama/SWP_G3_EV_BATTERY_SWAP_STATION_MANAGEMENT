'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransferDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.belongsToMany(models.Battery, { through: 'TransferBatteryDetails', as: 'batteries', foreignKey: 'transfer_detail_id', otherKey: 'battery_id' })
        this.belongsTo(models.TransferRequest, { as: 'transferRequest', foreignKey: 'transfer_request_id' });
        this.belongsTo(models.Account, { as: 'staff', foreignKey: 'staff_id' });
        this.belongsTo(models.Station, { as: 'station', foreignKey: 'station_id' });
    }
  }
  TransferDetail.init(
    {
      transfer_detail_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      transfer_request_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'TransferRequests',
          key: 'transfer_request_id'
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
      modelName: 'TransferDetail',
      tableName: 'TransferDetails',
      timestamps: false
    }
  );
  
  return TransferDetail;
};