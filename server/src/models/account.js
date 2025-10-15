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
      this.hasMany(models.Transfer, { as: 'adminTransfers', foreignKey: 'admin_id' });
      // Station Staff
      this.hasMany(models.Transfer, { as: 'staffTransfers', foreignKey: 'staff_id' });
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
  Account.init(
    {
      account_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
      },
      fullname: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      citizen_id: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
      },
      driving_license: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      permission: {
        type: DataTypes.ENUM('driver', 'admin', 'staff'),
        allowNull: false
      },
      reset_token: DataTypes.STRING,
    reset_token_expires: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'Account',
      tableName: 'Accounts',
      timestamps: false
    }
  );
  return Account;
};