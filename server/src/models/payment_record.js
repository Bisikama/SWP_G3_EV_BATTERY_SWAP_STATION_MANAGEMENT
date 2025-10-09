'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PaymentRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Invoice, { as: 'invoice_id', foreignKey: 'invoice_id' });
    }
  }
  PaymentRecord.init({
    payment_id: DataTypes.UUID,
    invoice_id: DataTypes.UUID,
    transaction_num: DataTypes.STRING,
    payment_date: DataTypes.DATE,
    payment_method: DataTypes.STRING,
    amount: DataTypes.DECIMAL,
    status: DataTypes.ENUM
  }, {
    sequelize,
    modelName: 'PaymentRecord',
  });
  return PaymentRecord;
};