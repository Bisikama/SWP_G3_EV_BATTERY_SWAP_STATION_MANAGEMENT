const { Account } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../utils/tokenBlacklist');

async function authenticate({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const account = await Account.findOne({ where: { email } });
  if (!account) {
    const err = new Error('Email or password is incorrect');
    err.status = 401;
    throw err;
  }

  if (account.status !== 'active') {
    const err = new Error('Account is not active');
    err.status = 403;
    throw err;
  }

  let match;
  try {
    match = await bcrypt.compare(password, account.password_hash);
  } catch (err) {
    console.error('Error comparing password', err);
    const e = new Error('Failed to verify password');
    e.status = 500;
    throw e;
  }

  if (!match) {
    const err = new Error('Email or password is incorrect');
    err.status = 401;
    throw err;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Server configuration error');
    err.status = 500;
    throw err;
  }

  const payload = {
    account_id: account.account_id,
    email: account.email,
    role: account.role
  };
  try {
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });
    return token;
  } catch (err) {
    console.error('JWT sign error', err);
    const e = new Error('Authentication error');
    e.status = 500;
    throw e;
  }
}

function logout(token) {
  tokenBlacklist.add(token);
}

module.exports = { authenticate, logout };