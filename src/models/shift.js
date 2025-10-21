'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Shift extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Account, { as: 'admin', foreignKey: 'admin_id' });
      this.belongsTo(models.Account, { as: 'staff', foreignKey: 'staff_id' });
      this.belongsTo(models.Station, { as: 'station', foreignKey: 'station_id' });
    }
  }
  Shift.init(
    {
      shift_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      staff_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'account_id'
        }
      },
      station_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'station_id'
        }
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('assigned', 'confirmed', 'cancelled'),
        allowNull: false,
        defaultValue: 'assigned'
      }
    },
    {
      sequelize,
      modelName: 'Shift',
      tableName: 'Shifts',
      timestamps: false
    }
  );

  // hooks
  Shift.beforeSave(async (shift, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(shift.admin_id);
    if (!account || account.permission !== 'admin') {
      throw new Error('Shift must be assigned by an admin');
    }
  });
  Shift.beforeSave(async (shift, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(shift.staff_id);
    if (!account || account.permission !== 'staff') {
      throw new Error('Shift must be assigned to a staff');
    }
  });

  return Shift;
};