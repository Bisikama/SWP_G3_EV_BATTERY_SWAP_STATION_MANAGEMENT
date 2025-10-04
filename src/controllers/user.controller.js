// src/controllers/user.controller.js
const User = require('../models/user.model');

// Lấy toàn bộ user
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo user mới
exports.createUser = async (req, res) => {
  try {
    const { FullName, Email,  PasswordHash } = req.body;
    const result = await User.create({ FullName, Email, PasswordHash });
    if (result > 0) {
      res.status(201).json({ message: 'User created successfully' });
    } else {
      res.status(400).json({ message: 'Failed to create user' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy user theo ID
exports.getUserByID = async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy user theo Email
exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.getByEmail(req.params.email);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Đăng ký user mới
const bcrypt = require('bcrypt');
exports.register = async (req, res) => {
  try {
    const { FullName, Email, PasswordHash } = req.body;

    const hashed = await bcrypt.hash(PasswordHash, 10);
    await User.create({ FullName, Email, PasswordHash: hashed });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Đăng nhập user
// POST /login
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { Email, PasswordHash } = req.body;

    const user = await User.getByEmail(Email);
    if (!user) return res.status(400).json({ message: "Email not found" });

    const match = await bcrypt.compare(PasswordHash, user.PasswordHash);
    if (!match) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ userId: user.UserID }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login success", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

