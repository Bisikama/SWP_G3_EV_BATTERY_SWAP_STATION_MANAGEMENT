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
  SupportTicket.init({
    ticket_id: DataTypes.UUID,
    driver_id: DataTypes.UUID,
    admin_id: DataTypes.UUID,
    create_date: DataTypes.DATE,
    resolve_date: DataTypes.DATE,
    subject: DataTypes.ENUM(
      'battery_issue',
      'vehicle_issue',
      'station_issue',
      'account_issue',
      'payment_issue',
      'other'
    ),
    description: DataTypes.TEXT,
    status: DataTypes.ENUM('pending','resolved')
  }, {
    sequelize,
    modelName: 'SupportTicket',
  });

  // hooks
  SupportTicket.beforeSave(async (ticket, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(ticket.driver_id);
    if (!account || account.permission !== 'driver') {
      throw new Error('Support ticket must be created by a driver');
    }
  });
  SupportTicket.beforeSave(async (ticket, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(ticket.admin_id);
    if (!account || account.permission !== 'admin') {
      throw new Error('Support ticket must be resolved by an admin');
    }
  });

  return SupportTicket;
};