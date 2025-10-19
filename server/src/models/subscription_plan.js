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
      this.hasMany(models.Subscription, { as: 'subscriptions', foreignKey: 'plan_id' });
      this.belongsTo(models.Account, { as: 'admin', foreignKey: 'admin_id' });
    }
  }
  SubscriptionPlan.init(
    {
      plan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      plan_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      plan_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      deposit_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      penalty_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      battery_cap: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      soh_cap: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      duration_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'SubscriptionPlan',
      tableName: 'SubscriptionPlans',
      timestamps: false
    }
  );

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