'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SupportTicket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
      this.belongsTo(models.Account, { as: 'admin', foreignKey: 'admin_id' });
    }
  }
  SupportTicket.init(
    {
      ticket_id: {
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
      admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      create_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      resolve_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      subject: {
        type: DataTypes.ENUM(
          'battery_issue',
          'vehicle_issue',
          'station_issue',
          'account_issue',
          'payment_issue',
          'other'
        ),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'resolved'),
        allowNull: false,
        defaultValue: 'pending'
      }
    },
    {
      sequelize,
      modelName: 'SupportTicket',
      tableName: 'SupportTickets',
      timestamps: false
    }
  );

  // hooks
  SupportTicket.beforeSave(async (ticket, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(ticket.driver_id);
    if (!account || account.role !== 'driver') {
      throw new Error('Support ticket must be created by a driver');
    }
  });
  SupportTicket.beforeSave(async (ticket, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(ticket.admin_id);
    if (!account || account.role !== 'admin') {
      throw new Error('Support ticket must be resolved by an admin');
    }
  });

  return SupportTicket;
};