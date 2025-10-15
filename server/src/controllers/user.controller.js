'use strict';
const { Account } = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const SALT_ROUNDS = 10;
const { sendPasswordResetEmail, sendPasswordChangeConfirmation } = require('../utils/emailService');
const userService = require('../services/user.service');

async function findAll(req, res) {
  const users = await userService.findAll();
  return res.status(200).json({ 
    success: true,
    payload: { users }
  });
}

async function findById(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Id is required' });
  const user = await userService.findById(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.status(200).json({ 
    success: true,
    payload: { user }
  });
}

async function findByEmail(req, res) {
  const { email } = req.params;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await userService.findByEmail(email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.status(200).json({
    success: true,
    payload: { user }
  });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  const token = await userService.authenticate({ email, password });
  const account = await userService.findByEmail(email);
  return res.status(200).json({ 
    success: true,
    payload: { token, account } 
  });
}

async function register(req, res) {
  try {
    const { email, password, fullname, phone_number } = req.body || {};
    // force default permission to 'driver' for self-register
    const permission = 'driver';
    if (!email || !password ) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    // check existing
    const exists = await Account.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const newAccount = await Account.create({ email, password_hash: hash, fullname, phone_number, permission });

    // return safe fields
    const safeAccount = {
      account_id: newAccount.account_id,
      email: newAccount.email,
      fullname: newAccount.fullname,
      phone_number: newAccount.phone_number,
      permission: newAccount.permission,
      status: newAccount.status
    };
    return res.status(201).json({ account: safeAccount });
  } catch (err) {
    console.error('Register error:', err.message);
  if (err.parent) console.error('Database says:', err.parent.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// logout: add token to blacklist (expects Authorization: Bearer <token>)
async function logout(req, res) {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(400).json({ message: 'Invalid authorization header' });
  const token = parts[1];
  userService.logout(token);
  return res.status(200).json({ 
    success: true,
    message: 'Logged out' 
  });
}

/**
 * Request password reset
 * Expected body: { email }
 * Sends email with reset token
 * Responses:
 *  - 200: { message: 'Reset email sent' }
 *  - 400: invalid input
 *  - 404: email not found
 *  - 500: server error
 */
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // check if email exists
    const account = await Account.findOne({ where: { email } });
    if (!account) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // set expiry time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // save to database
    account.reset_token = hashedToken;
    account.reset_token_expires = expiresAt;
    await account.save();

    // send email (optional - will log error if SMTP not configured)
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    if (!emailSent) {
      console.warn('Failed to send reset email, but token saved to DB');
    }

    return res.json({ 
      message: 'Reset email sent if email exists',
      // For development/testing - remove in production
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (err) {
    console.error('Request password reset error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Reset password with token
 * Expected body: { token, newPassword }
 * Responses:
 *  - 200: { message: 'Password reset successful' }
 *  - 400: invalid input or expired token
 *  - 404: invalid token
 *  - 500: server error
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // find account with this token
    const account = await Account.findOne({ 
      where: { reset_token: hashedToken } 
    });

    if (!account) {
      return res.status(404).json({ message: 'Invalid or expired reset token' });
    }

    // check if token expired
    if (account.reset_token_expires < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // hash new password
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // update password and clear reset token
    account.password_hash = hash;
    account.reset_token = null;
    account.reset_token_expires = null;
    await account.save();

    // send confirmation email
    await sendPasswordChangeConfirmation(account.email);

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { findAll, login, register, logout, requestPasswordReset, resetPassword, findById, findByEmail };
