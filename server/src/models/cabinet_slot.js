'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CabinetSlot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
  this.hasOne(models.Battery, { as: 'battery', foreignKey: 'slot_id' });
  this.belongsTo(models.Cabinet, { as: 'cabinet', foreignKey: 'cabinet_id' });
    }
  }
  CabinetSlot.init({
    slot_id: DataTypes.INTEGER,
    cabinet_id: DataTypes.INTEGER,
    slot_number: DataTypes.STRING,
    voltage: DataTypes.DECIMAL,
    current: DataTypes.DECIMAL,
    status: DataTypes.ENUM('empty', 'charging', 'charged', 'faulty')
  }, {
    sequelize,
    modelName: 'CabinetSlot',
  });
  return CabinetSlot;
};