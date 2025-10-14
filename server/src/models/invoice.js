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
  Invoice.init(
    {
      invoice_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      driver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      subscription_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Subscriptions',
          key: 'subscription_id'
        }
      },
      invoice_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      create_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      total_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      }
    },
    {
      sequelize,
      modelName: 'Invoice',
      tableName: 'Invoices',
      timestamps: false
    }
  );

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