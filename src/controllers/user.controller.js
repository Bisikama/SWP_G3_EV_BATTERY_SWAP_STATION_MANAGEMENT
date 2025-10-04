// src/controllers/user.controller.js
const User = require('../models/user.model');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { Fullname, email, password } = req.body;
    const result = await User.create({ Fullname, email, password });
    if (result > 0) {
      res.status(201).json({ message: 'User created successfully' });
    } else {
      res.status(400).json({ message: 'Failed to create user' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserByID = async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
