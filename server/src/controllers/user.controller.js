'use strict';
const { Account } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_ROUNDS = 10;
const tokenBlacklist = require('../utils/tokenBlacklist');

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
    console.error('Register error', err);
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

module.exports = { getAll, login, register, logout};
