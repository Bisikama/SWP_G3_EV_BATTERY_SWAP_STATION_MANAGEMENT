'use strict';
const { Account } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_ROUNDS = 10;
const tokenBlacklist = require('../utils/tokenBlacklist');

async function findAll() {
  return Account.findAll({
    attributes: [
      'account_id',
      'email',
      'fullname',
      'phone_number',
      'permission',
      'status'
    ]
  });
}

async function findById(id) {
  if (!id) return null;
  return Account.findByPk(id, {
    attributes: [
      'account_id',
      'email',
      'fullname',
      'phone_number',
      'permission',
      'status'
    ]
  });
}

async function findByEmail(email) {
  if (!email) return null;
  return Account.findOne({
    where: { email },
    attributes: [
      'account_id',
      'email',
      'fullname',
      'phone_number',
      'permission',
      'status'
    ]
  });
}

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

async function createAccount({ email, password, fullname, phone_number, permission = 'driver' }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const emailExists = await Account.findOne({ where: { email } });
  if (emailExists) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const phoneExists = await Account.findOne({ where: { phone_number } });
  if (phoneExists) {
    const err = new Error('Phone number already registered');
    err.status = 409;
    throw err;
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

  return findById(newAccount.account_id);
}

function logout(token) {
  tokenBlacklist.add(token);
}

module.exports = { findAll, findById, findByEmail, authenticate, createAccount, logout };
