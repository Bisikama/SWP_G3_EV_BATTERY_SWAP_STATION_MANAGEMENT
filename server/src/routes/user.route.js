const express = require('express');
const router = express.Router();
const validateRegister = require('../middlewares/validateRegister');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const userController = require('../controllers/user.controller');

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullname:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already registered
 */
router.post('/register', validateRegister, userController.register);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out
 *       400:
 *         description: Invalid authorization header
 *       500:
 *         description: Internal server error
 */
router.post('/logout', userController.logout);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 */
router.get('/', userController.findAll);

/**
 * @swagger
 * /api/user/id/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/id/:id', userController.findById);

/**
 * @swagger
 * /api/user/email/{email}:
 *   get:
 *     summary: Get user by email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user email
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/email/:email', userController.findByEmail);

// 🔐 Route chỉ cho phép Admin truy cập
router.get('/admin/dashboard', verifyToken, authorizeRole('Admin'), (req, res) => {
  res.json({ message: `Welcome, Admin ${req.user.email}` });
});

// 🔐 Route cho phép cả Admin và Staff
router.post('/station/update', verifyToken, authorizeRole('Admin', 'Staff'), (req, res) => {
  res.json({ message: `Station updated by ${req.user.permission}` });
});

// 🔐 Route cho phép mọi user đăng nhập (không cần giới hạn role)
router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}`, role: req.user.permission });
});

module.exports = router;