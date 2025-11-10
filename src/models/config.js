// ========================================
// CONFIG MODEL
// ========================================
// File: src/models/config.js
// Purpose: Sequelize model for system configuration table
// 
// Fields:
// - config_id: PK, auto-increment
// - booking_expired_interval: int2 - Interval in minutes for booking expiration (default 30)
// ========================================

'use strict';

module.exports = (sequelize, DataTypes) => {
  const Config = sequelize.define('Config', {
    config_name: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    booking_expired_interval: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 30,
      comment: 'Booking expiration interval in minutes'
    },
    soh_available_threshole: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'SOH threshold for battery availability (0-100%)'
    },
    soh_maintenance_threshole: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'SOH threshold for battery maintenance (0-100%)'
    },
    soc_available_threshole: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'SOC threshold for battery availability (0-100%)'
    },
    allowed_empty_slot: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of allowed empty slots in cabinet'
    }
  }, {
    tableName: 'Configs',
    timestamps: false,
    freezeTableName: true
  });

  return Config;
};
