"use strict";
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
  const { username, email, password, fullname, phone_number } = req.body || {};
  const account = await userService.createAccount({ username, email, password, fullname, phone_number, permission: 'driver' });
  return res.status(201).json({ 
    success: true,
    payload: { account }
  });
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

module.exports = { findAll, login, register, logout, findById, findByEmail };
