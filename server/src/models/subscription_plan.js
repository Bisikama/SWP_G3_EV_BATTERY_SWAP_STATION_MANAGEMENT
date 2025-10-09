'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubscriptionPlan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Subscription, { as: 'plan_id', foreignKey: 'plan_id' });
      this.belongsTo(models.Account, { as: 'admin_id', foreignKey: 'admin_id' });
    }
  }
  SubscriptionPlan.init({
    plan_id: DataTypes.INTEGER,
    admin_id: DataTypes.UUID,
    plan_name: DataTypes.STRING,
    plan_fee: DataTypes.DECIMAL,
    battery_cap: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'SubscriptionPlan',
  });

  // hooks
  SubscriptionPlan.beforeSave(async (plan, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(plan.admin_id);
    if (!account || account.permission !== 'admin') {
      throw new Error('Plan creator must be an admin');
    }
  });

  return SubscriptionPlan;
};