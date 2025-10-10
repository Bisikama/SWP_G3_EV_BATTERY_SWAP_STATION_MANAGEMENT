'use strict';
const { Account } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

module.exports = { getAll, login };
