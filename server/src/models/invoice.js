'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
  this.hasMany(models.PaymentRecord, { as: 'payments', foreignKey: 'invoice_id' });
  this.belongsTo(models.Subscription, { as: 'subscription', foreignKey: 'subscription_id' });
  this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
    }
  }
  Invoice.init({
    invoice_id: DataTypes.UUID,
    driver_id: DataTypes.UUID,
    subscription_id: DataTypes.UUID,
    invoice_number: DataTypes.STRING,
    create_date: DataTypes.DATEONLY,
    due_date: DataTypes.DATEONLY,
    total_fee: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'Invoice',
  });

  // hooks
  Invoice.beforeSave(async (invoice, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(invoice.driver_id);
    if (!account || account.permission !== 'driver') {
      throw new Error('Invoice must be associated with a driver');
    }
  });

  return Invoice;
};