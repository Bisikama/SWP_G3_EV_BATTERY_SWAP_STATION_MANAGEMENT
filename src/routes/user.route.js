// src/routes/user.route.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.get('/users', userController.getAllUsers);   // GET /api/users
router.post('/users', userController.createUser);   // POST /api/users

router.get('/users/:id', userController.getUserByID); // GET /api/users/:id
module.exports = router;
