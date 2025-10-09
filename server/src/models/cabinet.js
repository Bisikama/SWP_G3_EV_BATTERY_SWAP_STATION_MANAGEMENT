'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Cabinet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.CabinetSlot, { as: 'cabinet_id', foreignKey: 'cabinet_id' });
      this.belongsTo(models.Station, { as: 'station_id', foreignKey: 'station_id' });
    }
  }
  Cabinet.init({
    cabinet_id: DataTypes.INTEGER,
    station_id: DataTypes.INTEGER,
    cabinet_name: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    power_capacity_kw: DataTypes.DECIMAL,
    status: DataTypes.ENUM
  }, {
    sequelize,
    modelName: 'Cabinet',
  });
  return Cabinet;
};