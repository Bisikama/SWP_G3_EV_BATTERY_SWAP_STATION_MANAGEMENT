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
      this.belongsTo(models.Invoice, { as: 'invoice', foreignKey: 'invoice_id' });
    }
  }
  PaymentRecord.init(
    {
      payment_id: {
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
      transaction_num: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      status: {
        type: DataTypes.ENUM('success', 'fail'),
        allowNull: false
      },
      message: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Payment result message from MoMo'
      },
      payment_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Payment type: qr, app, web, etc.'
      },
      signature: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'MoMo signature for verification'
      }
    },
    {
      sequelize,
      modelName: 'PaymentRecord',
      tableName: 'PaymentRecords',
      timestamps: false
    }
  );
  return PaymentRecord;
};