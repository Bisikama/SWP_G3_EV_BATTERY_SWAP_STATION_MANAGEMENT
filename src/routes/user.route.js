const express = require('express');
const router = express.Router();
const validateRegister = require('../middlewares/validateRegister');
const { validateResetPassword } = require('../middlewares/validatePassword');
const userController = require('../controllers/user.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

router.post('/login', userController.login);
router.post('/request-verification', userController.requestEmailVerification);
router.post('/verify-email', userController.verifyEmailCode);
router.post('/register', validateRegister, userController.register);
router.post('/logout', userController.logout);
router.get('/', userController.findAll);
router.post('/forgot-password', userController.requestPasswordReset);
router.post('/reset-password', validateResetPassword, userController.resetPassword);
router.get('/id/:id', userController.findById);
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
 *                 type: strings
 *     responses:
 *       200:
 *         description: Login successful, returns JWT
 *       401:
 *         description: Invalid credentials
 */


/**
 * @swagger
 * /api/user/request-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Request email verification (Step 1 of registration)
 *     description: |
 *       Initiates the registration process by sending a 6-digit verification code to the user's email.
 *       User must enter this code on the website to verify their email before completing registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email address to verify
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
 *       400:
 *         description: Invalid input or email already registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already registered. Please login instead.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */


/**
 * @swagger
 * /api/user/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with code (Step 2 of registration)
 *     description: |
 *       User enters the 6-digit code received via email.
 *       After successful verification, user can proceed to complete registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email address being verified
 *               code:
 *                 type: string
 *                 example: "123456"
 *                 description: The 6-digit verification code received via email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully! You can now complete your registration.
 *                 verified:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid or expired code, or email already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid verification code. Please try again.
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email not found. Please request verification first.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */


/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user (Step 3 - Complete registration)
 *     description: |
 *       Final step of registration after email verification.
 *       User must have verified their email first using /request-verification and /verify-email.
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


/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Logout the currently authenticated user by invalidating their JWT token. Requires a valid Bearer token in the Authorization header.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         description: JWT token with Bearer prefix
 *     responses:
 *       200:
 *         description: Logout successful - token has been blacklisted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out
 *       400:
 *         description: Invalid authorization header format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid authorization header
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */


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


/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     description: Send a 6-digit verification code to the user's email for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email address of the user requesting password reset
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
 *       400:
 *         description: Invalid input - email is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email is required
 *       404:
 *         description: Email not found in database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with 6-digit code
 *     description: Reset user password using the 6-digit code received via email. Password must be at least 8 characters with uppercase, lowercase, and numbers.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Email address of the user
 *               code:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit verification code received via email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *                 description: New password (min 8 chars, must contain uppercase, lowercase, and number)
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Đặt lại mật khẩu thành công
 *       400:
 *         description: Invalid input or expired code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.
 *       404:
 *         description: Invalid code or email not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mã xác thực không hợp lệ
 *       500:
 *         description: Internal server error
 */


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


// ========================================
// VEHICLE ROUTES MOVED TO vehicles.route.js
// ========================================
// All vehicle-related routes have been moved to:
// - File: src/routes/vehicles.route.js
// - Base path: /api/vehicles
// - This improves code organization and follows single responsibility principle
// ========================================



module.exports = router;