'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Admin
      this.hasMany(models.SubscriptionPlan, { as: 'admin_id', foreignKey: 'admin_id' });
      this.hasMany(models.SupportTicket, { as: 'admin_id', foreignKey: 'admin_id' });
      this.hasMany(models.Shift, { as: 'admin_id', foreignKey: 'admin_id' });
      // Warehouse Manager
      this.hasMany(models.TransferRecord, { as: 'manager_id', foreignKey: 'manager_id' });
      this.hasOne(models.Warehouse, { as: 'manager_id', foreignKey: 'manager_id' });
      // Station Staff
      this.hasMany(models.TransferRecord, { as: 'staff_id', foreignKey: 'staff_id' });
      this.hasOne(models.Shift, { as: 'staff_id', foreignKey: 'staff_id' });
      // EV Driver
      this.hasMany(models.SupportTicket, { as: 'driver_id', foreignKey: 'driver_id' });
      this.hasMany(models.Booking, { as: 'driver_id', foreignKey: 'driver_id' });
      this.hasMany(models.Invoice, { as: 'driver_id', foreignKey: 'driver_id' });
      this.hasMany(models.Subscription, { as: 'driver_id', foreignKey: 'driver_id' });
      this.hasMany(models.Vehicle, { as: 'driver_id', foreignKey: 'driver_id' });
      this.hasMany(models.SwapRecord, { as: 'driver_id', foreignKey: 'driver_id' });
    }
  }
  Account.init({
    account_id: DataTypes.UUID,
    username: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    fullname: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    email: DataTypes.STRING,
    status: DataTypes.ENUM,
    permission: DataTypes.ENUM
  }, {
    sequelize,
    modelName: 'Account',
  });
  return Account;
};