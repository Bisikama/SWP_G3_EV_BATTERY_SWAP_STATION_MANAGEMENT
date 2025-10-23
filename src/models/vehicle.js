'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vehicle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.hasMany(models.SwapRecord, { as: 'swapRecords', foreignKey: 'vehicle_id' });
        this.hasMany(models.Battery, { as: 'batteries', foreignKey: 'vehicle_id' });
        this.hasMany(models.Booking, { as: 'booking', foreignKey: 'vehicle_id' });
        this.hasMany(models.Subscription, { as: 'subscriptions', foreignKey: 'vehicle_id' });
        this.belongsTo(models.Account, { as: 'driver', foreignKey: 'driver_id' });
        this.belongsTo(models.VehicleModel, { as: 'model', foreignKey: 'model_id' });
    }
  }
  Vehicle.init(
    {
      vehicle_id: {
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
      model_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'VehicleModels',
          key: 'model_id'
        }
      },
      license_plate: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      vin: {
        type: DataTypes.STRING(17),
        allowNull: false,
        unique: true
      },
      take_first: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      }
    },
    {
      sequelize,
      modelName: 'Vehicle',
      tableName: 'Vehicles',
      timestamps: false
    }
  );

  // hooks
  Vehicle.beforeSave(async (vehicle, options) => {
    const Account = sequelize.models.Account;
    const account = await Account.findByPk(vehicle.driver_id);
    if (!account || account.role !== 'driver') {
      throw new Error('Vehicle must be associated with a driver');
    }
  });

  return Vehicle;
};