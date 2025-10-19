'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmailChallenge extends Model {
    /**
     * Không liên kết khóa ngoại — chỉ lưu dữ liệu tạm thời.
     */
    static associate(models) {
      // Không có quan hệ (bảng tạm)
    }
  }

  EmailChallenge.init(
    {
      challenge_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      hashed_code: {
        type: DataTypes.STRING,
        allowNull: false
      },
      token_reset: {
        type: DataTypes.STRING,
        allowNull: true
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      purpose: {
        type: DataTypes.ENUM('register', 'reset_password', 'verify_email'),
        allowNull: false,
        defaultValue: 'register'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'EmailChallenge',
      tableName: 'EmailChallenges',
      timestamps: false
    }
  );

  return EmailChallenge;
};
