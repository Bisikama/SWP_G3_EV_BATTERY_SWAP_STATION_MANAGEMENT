'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EmailChallenges', {
      challenge_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      hashed_code: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'SHA256 hash of verification code or reset token'
      },
      token_reset: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Plain text token for reset password link (only for reset_password purpose)'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Expiration timestamp for the challenge'
      },
      used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the challenge has been used'
      },
      purpose: {
        type: Sequelize.ENUM('register', 'reset_password', 'verify_email'),
        allowNull: false,
        defaultValue: 'register',
        comment: 'Purpose of the challenge'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add index for faster email lookups
    await queryInterface.addIndex('EmailChallenges', ['email', 'purpose', 'used'], {
      name: 'idx_email_purpose_used'
    });

    // Add index for cleanup of expired challenges
    await queryInterface.addIndex('EmailChallenges', ['expires_at'], {
      name: 'idx_expires_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EmailChallenges');
  }
};
