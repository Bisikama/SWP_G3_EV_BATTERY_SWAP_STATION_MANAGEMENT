// src/routes/user.route.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middlewares/verifyTokens');

//Routes công khai (không cần xác thực)
router.get('/users', userController.getAllUsers);   // GET /api/users
router.post('/users', userController.createUser);   // POST /api/users
router.get('/users/:id', userController.getUserByID); // GET /api/users/:id
router.get('/users/email/:email', userController.getUserByEmail); // GET /api/users/email/:email
router.post('/register', userController.register); // POST /api/register
router.post('/login', userController.login); // POST /api/login



//Routes bảo vệ (cần xác thực)
// router.put('/users/:id', verifyToken, userController.updateUser);

module.exports = router;
