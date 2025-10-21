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
      this.hasMany(models.CabinetSlot, { as: 'slots', foreignKey: 'cabinet_id' });
      this.belongsTo(models.Station, { as: 'station', foreignKey: 'station_id' });
    }
  }
  Cabinet.init(
    {
      cabinet_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      station_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Stations',
          key: 'station_id'
        }
      },
      cabinet_code: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      battery_capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      power_capacity_kw: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      status: {
        type: DataTypes.ENUM('operational', 'maintenance'),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Cabinet',
      tableName: 'Cabinets',
      timestamps: false
    }
  );
  return Cabinet;
};