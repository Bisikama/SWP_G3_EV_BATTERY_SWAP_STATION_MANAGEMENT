'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransferRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.hasMany(models.TransferDetail, { as: 'transferDetails', foreignKey: 'transfer_request_id' })
        this.belongsTo(models.Account, { as: 'admin', foreignKey: 'admin_id' });
        this.belongsTo(models.Account, { as: 'staff', foreignKey: 'staff_id' });
        this.belongsTo(models.Station, { as: 'station', foreignKey: 'station_id' });
    }
  }
  TransferRequest.init(
    {
      transfer_request_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      station_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'station_id'
        }
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      staff_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      request_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      approve_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      request_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'approved',
          'rejected'
        ),
        allowNull: false,
        defaultValue: 'pending'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'TransferRequest',
      tableName: 'TransferRequests',
      timestamps: false
    }
  );
  
  return TransferRequest;
};