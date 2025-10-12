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
  this.hasMany(models.SubscriptionPlan, { as: 'subscriptionPlans', foreignKey: 'admin_id' });
  this.hasMany(models.SupportTicket, { as: 'adminTickets', foreignKey: 'admin_id' });
  this.hasMany(models.Shift, { as: 'adminShifts', foreignKey: 'admin_id' });
  // Warehouse Manager
  this.hasMany(models.TransferRecord, { as: 'managedTransfers', foreignKey: 'manager_id' });
  this.hasOne(models.Warehouse, { as: 'managedWarehouse', foreignKey: 'manager_id' });
  // Station Staff
  this.hasMany(models.TransferRecord, { as: 'staffTransfers', foreignKey: 'staff_id' });
  this.hasOne(models.Shift, { as: 'assignedShift', foreignKey: 'staff_id' });
      // EV Driver
      this.hasMany(models.SupportTicket, { as: 'tickets', foreignKey: 'driver_id' });
      this.hasMany(models.Booking, { as: 'bookings', foreignKey: 'driver_id' });
      this.hasMany(models.Invoice, { as: 'invoices', foreignKey: 'driver_id' });
      this.hasMany(models.Subscription, { as: 'subscriptions', foreignKey: 'driver_id' });
      this.hasMany(models.Vehicle, { as: 'vehicles', foreignKey: 'driver_id' });
      this.hasMany(models.SwapRecord, { as: 'swapRecords', foreignKey: 'driver_id' });
    }
  }
  Account.init({
    account_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    fullname: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    email: DataTypes.STRING,
    status: DataTypes.ENUM('active', 'inactive'),
    permission: DataTypes.ENUM('driver', 'admin', 'manager', 'staff'),
  }, {
    sequelize,
    modelName: 'Account',
  });
  return Account;
};