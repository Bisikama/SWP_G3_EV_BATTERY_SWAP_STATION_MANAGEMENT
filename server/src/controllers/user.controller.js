'use strict';
const { Account } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const SALT_ROUNDS = 10;
const tokenBlacklist = require('../utils/tokenBlacklist');
const { sendPasswordResetEmail, sendPasswordChangeConfirmation } = require('../utils/emailService');

async function getAll(req, res) {
  try {
    const users = await Account.findAll();
    res.json(users);
  } catch (err) {
    console.error('Get all users error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Login controller
 * Expected body: { email, password }
 * Responses:
 *  - 200: { token, account }
 *  - 400: invalid input
 *  - 401: invalid credentials
 *  - 500: server error
 */
async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const account = await Account.findOne({ where: { email } });
    if (!account) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const hash = account.password_hash;
    const match = await bcrypt.compare(password, hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const payload = {
      account_id: account.account_id,
      email: account.email,
      permission: account.permission
    };
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });

    // return safe account fields
    const safeAccount = {
      account_id: account.account_id,
      username: account.username,
      email: account.email,
      fullname: account.fullname,
      phone_number: account.phone_number,
      permission: account.permission,
      status: account.status
    };

    return res.json({ token, account: safeAccount });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function register(req, res) {
  try {
    const { username, email, password, fullname, phone_number } = req.body || {};
    // force default permission to 'driver' for self-register
    const permission = 'driver';
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }

    // check existing
    const exists = await Account.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const newAccount = await Account.create({ username, email, password_hash: hash, fullname, phone_number, permission });

    // return safe fields
    const safeAccount = {
      account_id: newAccount.account_id,
      username: newAccount.username,
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
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(400).json({ message: 'Invalid authorization header' });
    const token = parts[1];
    tokenBlacklist.add(token);
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
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

module.exports = { getAll, login, register, logout, requestPasswordReset, resetPassword };
