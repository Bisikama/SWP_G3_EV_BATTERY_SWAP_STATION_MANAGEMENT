'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TransferRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Battery, { through: 'RetrievedTransferBattery', as: 'retrieved_transfer_id', foreignKey: 'transfer_id', otherKey: 'battery_id' });
      this.belongsToMany(models.Battery, { through: 'ReturnedTransferBattery', as: 'returned_transfer_id', foreignKey: 'transfer_id', otherKey: 'battery_id' });
      this.belongsTo(models.Account, { as: 'manager_id', foreignKey: 'manager_id' });
      this.belongsTo(models.Account, { as: 'staff_id', foreignKey: 'staff_id' });
      this.belongsTo(models.Warehouse, { as: 'warehouse_id', foreignKey: 'warehouse_id' });
      this.belongsTo(models.Station, { as: 'station_id', foreignKey: 'station_id' });
    }
  }
  TransferRecord.init({
    transfer_id: DataTypes.UUID,
    warehouse_id: DataTypes.INTEGER,
    station_id: DataTypes.INTEGER,
    manager_id: DataTypes.UUID,
    staff_id: DataTypes.UUID,
    create_time: DataTypes.DATE,
    accept_time: DataTypes.DATE,
    confirm_time: DataTypes.DATE,
    status: DataTypes.ENUM,
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TransferRecord',
  });

  // hooks
  TransferRecord.beforeSave(async (transfer, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(transfer.manager_id);
    if (!account || account.permission !== 'manager') {
      throw new Error('Transfer record must be accepted by a manager');
    }
  });
  TransferRecord.beforeSave(async (transfer, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(transfer.staff_id);
    if (!account || account.permission !== 'staff') {
      throw new Error('Transfer record must be confirmed by a staff');
    }
  });
  
  return TransferRecord;
};