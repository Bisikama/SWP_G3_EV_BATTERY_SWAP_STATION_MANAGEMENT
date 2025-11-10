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
    }
  }, {
    tableName: 'Configs',
    timestamps: false,
    freezeTableName: true
  });

  return Config;
};
