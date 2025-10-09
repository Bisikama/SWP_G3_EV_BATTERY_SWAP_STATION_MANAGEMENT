'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.TransferRecord, { as: 'warehouse_id', foreignKey: 'warehouse_id' });
      this.hasMany(models.Battery, { as: 'warehouse_id', foreignKey: 'warehouse_id' });
      this.belongsTo(models.Account, { as: 'manager_id', foreignKey: 'manager_id' });
    }
  }
  Warehouse.init({
    warehouse_id: DataTypes.INTEGER,
    manager_id: DataTypes.UUID,
    warehouse_name: DataTypes.STRING,
    address: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    stock: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Warehouse',
  });

  // hooks
  Warehouse.beforeSave(async (warehouse, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(warehouse.manager_id);
    if (!account || account.permission !== 'manager') {
      throw new Error('Warehouse must be associated with a manager');
    }
  });

  return Warehouse;
};