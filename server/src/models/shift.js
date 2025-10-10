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
  Shift.init({
    shift_id: DataTypes.UUID,
    admin_id: DataTypes.UUID,
    staff_id: DataTypes.UUID,
    station_id: DataTypes.INTEGER,
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    status: DataTypes.ENUM('assigned', 'confirmed', 'cancelled')
  }, {
    sequelize,
    modelName: 'Shift',
  });

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