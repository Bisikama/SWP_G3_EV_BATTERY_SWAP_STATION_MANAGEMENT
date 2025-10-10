'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
  this.hasOne(models.Invoice, { as: 'invoice', foreignKey: 'subscription_id' });
  this.belongsTo(models.SubscriptionPlan, { as: 'plan', foreignKey: 'plan_id' });
  this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
  this.belongsTo(models.Vehicle, { as: 'vehicle', foreignKey: 'vehicle_id' });
    }
  }
  Subscription.init({
    subscription_id: DataTypes.UUID,
    driver_id: DataTypes.UUID,
    vehicle_id: DataTypes.UUID,
    plan_id: DataTypes.INTEGER,
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    status: DataTypes.ENUM('in-use','used','cancelled')
  }, {
    sequelize,
    modelName: 'Subscription',
  });

  // hooks
  Subscription.beforeSave(async (subscription, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(subscription.driver_id);
    if (!account || account.permission !== 'driver') {
      throw new Error('Subscription owner must be a driver');
    }
  });

  return Subscription;
};