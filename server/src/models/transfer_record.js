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
        this.belongsToMany(models.Battery, { through: 'RetrievedTransferBattery', as: 'retrievedBatteries', foreignKey: 'transfer_id', otherKey: 'battery_id' });
        this.belongsToMany(models.Battery, { through: 'ReturnedTransferBattery', as: 'returnedBatteries', foreignKey: 'transfer_id', otherKey: 'battery_id' });
        this.belongsTo(models.Account, { as: 'manager', foreignKey: 'manager_id' });
        this.belongsTo(models.Account, { as: 'staff', foreignKey: 'staff_id' });
     
        this.belongsTo(models.Station, { as: 'station', foreignKey: 'station_id' });
    }
  }
  TransferRecord.init({
    transfer_id: DataTypes.UUID,

    station_id: DataTypes.INTEGER,
    manager_id: DataTypes.UUID,
    staff_id: DataTypes.UUID,
    create_time: DataTypes.DATE,
    accept_time: DataTypes.DATE,
    confirm_time: DataTypes.DATE,
    status: DataTypes.ENUM('pending', 'accepted', 'rejected', 'confirmed'),
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