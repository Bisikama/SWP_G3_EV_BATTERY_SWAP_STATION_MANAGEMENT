'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transfer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.belongsToMany(models.Battery, { through: 'RetrievedTransferBattery', as: 'retrievedBatteries', foreignKey: 'transfer_id', otherKey: 'battery_id' });
        this.belongsToMany(models.Battery, { through: 'ReturnedTransferBattery', as: 'returnedBatteries', foreignKey: 'transfer_id', otherKey: 'battery_id' });
        this.belongsTo(models.Account, { as: 'admin', foreignKey: 'admin_id' });
        this.belongsTo(models.Account, { as: 'staff', foreignKey: 'staff_id' });
        this.belongsTo(models.Station, { as: 'originStation', foreignKey: 'origin_station_id' });
        this.belongsTo(models.Station, { as: 'destinationStation', foreignKey: 'destination_station_id' });
    }
  }
  Transfer.init(
    {
      transfer_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      origin_station_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'station_id'
        }
      },
      destination_station_id: {
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
      create_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      approve_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      complete_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'approved',
          'rejected',
          'transfering',
          'completed'
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
      modelName: 'Transfer',
      tableName: 'Transfers',
      timestamps: false
    }
  );

  // hooks
  // admin_id is optional; when provided, ensure it references an admin account
  Transfer.beforeSave(async (transfer, options) => {
    const Account = sequelize.models.Account;
    if (transfer.admin_id) {
      const account = await Account.findByPk(transfer.admin_id);
      if (!account || account.permission !== 'admin') {
        throw new Error('Transfer record admin must be an admin account');
      }
    }
  });
  Transfer.beforeSave(async (transfer, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(transfer.staff_id);
    if (!account || account.permission !== 'staff') {
      throw new Error('Transfer record must be confirmed by a staff');
    }
  });
  
  return Transfer;
};