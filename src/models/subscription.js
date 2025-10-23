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
      this.belongsTo(models.Invoice, { as: 'invoice', foreignKey: 'invoice_id' });
      this.belongsTo(models.SubscriptionPlan, { as: 'plan', foreignKey: 'plan_id' });
      this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
      this.belongsTo(models.Vehicle, { as: 'vehicle', foreignKey: 'vehicle_id' });
    }
  }
  Subscription.init(
    {
      subscription_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Invoices',
          key: 'invoice_id'
        }
      },
      driver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      vehicle_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Vehicles',
          key: 'vehicle_id'
        }
      },
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'SubscriptionPlans',
          key: 'plan_id'
        }
      },
      soh_usage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      swap_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      cancel_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'inactive'
      }
    },
    {
      sequelize,
      modelName: 'Subscription',
      tableName: 'Subscriptions',
      timestamps: false
    }
  );

  // hooks
  Subscription.beforeSave(async (subscription, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(subscription.driver_id);
    if (!account || account.role !== 'driver') {
      throw new Error('Subscription owner must be a driver');
    }
  });

  return Subscription;
};