"use strict";
const userService = require('../services/user.service');

async function findAll(req, res) {
  try {
    const users = await userService.findAll();
    res.json(users);
  } catch (err) {
    console.error('Get all users error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function findById(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Id is required' });
    const user = await userService.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('FindById error', err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Internal server error' });
  }
}

async function findByEmail(req, res) {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await userService.findByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('FindByEmail error', err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Internal server error' });
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
    const token = await userService.authenticate({ email, password });
    const account = await userService.findByEmail(email);
    return res.json({ token, account });
  } catch (err) {
    console.error('Login error', err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Internal server error' });
  }
}

async function register(req, res) {
  try {
    const { username, email, password, fullname, phone_number } = req.body || {};
    const account = await userService.createAccount({ username, email, password, fullname, phone_number, permission: 'driver' });
    return res.status(201).json({ account });
  } catch (err) {
    console.error('Register error', err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Internal server error' });
  }
}

// logout: add token to blacklist (expects Authorization: Bearer <token>)
async function logout(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(400).json({ message: 'Invalid authorization header' });
    const token = parts[1];
    userService.logout(token);
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

<<<<<<< HEAD
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
=======
module.exports = { findAll, login, register, logout, findById, findByEmail };
>>>>>>> 5fdeef0 (refactoring)
