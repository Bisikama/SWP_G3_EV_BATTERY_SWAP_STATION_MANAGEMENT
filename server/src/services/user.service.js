'use strict';
const { Account } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_ROUNDS = 10;
const tokenBlacklist = require('../utils/tokenBlacklist');

async function findAll() {
  try {
    const accounts = await Account.findAll({
      attributes: [
        'account_id',
        'username',
        'email',
        'fullname',
        'phone_number',
        'permission',
        'status'
      ]
    });
    return accounts;
  } catch (err) {
    console.error('DB error in findAll', err);
    const e = new Error('Database error');
    e.status = 500;
    throw e;
  }
}

async function findById(id) {
  try {
    if (!id) return null;
    const accounts = await Account.findByPk(id, {
      attributes: [
        'account_id',
        'username',
        'email',
        'fullname',
        'phone_number',
        'permission',
        'status'
      ]
    });
    return accounts;
  } catch (err) {
    console.error('DB error in findById', err);
    const e = new Error('Database error');
    e.status = 500;
    throw e;
  }
}

async function findByEmail(email) {
  try {
    if (!email) return null;
    const account = await Account.findOne({
      where: { email },
      attributes: [
        'account_id',
        'username',
        'email',
        'fullname',
        'phone_number',
        'permission',
        'status'
      ]
    });
    return account;
  } catch (err) {
    console.error('DB error in findByEmail', err);
    const e = new Error('Database error');
    e.status = 500;
    throw e;
  }
}

async function authenticate({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  let account;
  try {
    account = await Account.findOne({ where: { email } });
  } catch (err) {
    console.error('DB error in authenticate (findOne)', err);
    const e = new Error('Database error');
    e.status = 500;
    throw e;
  }
  if (!account) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  let match;
  try {
    match = await bcrypt.compare(password, account.password_hash);
  } catch (err) {
    console.error('Error comparing password', err);
    const e = new Error('Authentication error');
    e.status = 500;
    throw e;
  }
  if (!match) {
    const err = new Error('Invalid email or password');
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
    permission: account.permission
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

async function createAccount({ username, email, password, fullname, phone_number, permission = 'driver' }) {
  if (!username || !email || !password) {
    const err = new Error('username, email and password are required');
    err.status = 400;
    throw err;
  }

  try {
    const exists = await Account.findOne({ where: { email } });
    if (exists) {
      const err = new Error('Email already registered');
      err.status = 409;
      throw err;
    }
  } catch (err) {
    console.error('DB error in createAccount (findOne)', err);
    const e = new Error('Database error');
    e.status = 500;
    throw e;
  }

  let newAccount;
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    newAccount = await Account.create({ username, email, password_hash: hash, fullname, phone_number, permission });
  } catch (err) {
    console.error('DB error in createAccount (create)', err);
    const e = new Error('Database error');
    e.status = 500;
    throw e;
  }

  const safeAccount = findById(newAccount.account_id);

  return safeAccount;
}

function logout(token) {
  tokenBlacklist.add(token);
}

module.exports = { findAll, findById, findByEmail, authenticate, createAccount, logout };
