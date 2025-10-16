const express = require('express');
const router = express.Router();
const validateRegister = require('../middlewares/validateRegister');
const { validateResetPassword } = require('../middlewares/validatePassword');
const userController = require('../controllers/user.controller');
const vehicleController = require('../controllers/vehicle.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
const validateVin = require('../middlewares/validateVin');

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
router.post('/register', validateRegister, userController.register);

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
 * /api/user/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     description: Send a password reset email to the user with a reset token
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
 *         description: Reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset email sent if email exists
 *                 resetToken:
 *                   type: string
 *                   example: abc123def456...
 *                   description: Reset token (only in development mode)
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
router.post('/forgot-password', userController.requestPasswordReset);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     description: Reset user password using the token received via email. Password must be at least 8 characters with uppercase, lowercase, and numbers.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456ghi789jkl012mno345pqr678
 *                 description: Reset token received via email
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
 *                   example: Password reset successful
 *       400:
 *         description: Invalid input or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset token has expired
 *       404:
 *         description: Invalid reset token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid or expired reset token
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', validateResetPassword, userController.resetPassword);

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

/**
 * @swagger
 * /api/user/vehicles:
 *   post:
 *     tags: [Vehicle]
 *     summary: Register a new vehicle
 *     description: Create a new vehicle registration for the authenticated driver
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *               - model_id
 *               - license_plate
 *             properties:
 *               vin:
 *                 type: string
 *                 example: 1HGBH41JXMN109186
 *                 description: Vehicle Identification Number (17 characters)
 *               model_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the vehicle model
 *               license_plate:
 *                 type: string
 *                 example: 30A-12345
 *                 description: Vehicle license plate number
 *     responses:
 *       201:
 *         description: Vehicle registered successfully
 *       400:
 *         description: Invalid VIN format or missing required fields
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Only drivers can register vehicles
 *       409:
 *         description: VIN or license plate already exists
 *       500:
 *         description: Internal server error
 */
router.post('/vehicles', verifyToken, validateVin, vehicleController.registerVehicle);

/**
 * @swagger
 * /api/user/vehicles:
 *   get:
 *     tags: [Vehicle]
 *     summary: Get all vehicles of authenticated driver
 *     description: Retrieve a list of all vehicles registered by the current driver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicles retrieved successfully
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/vehicles', verifyToken, vehicleController.getMyVehicles);

/**
 * @swagger
 * /api/user/vehicles/vin/{vin}:
 *   get:
 *     tags: [Vehicle]
 *     summary: Search vehicle by VIN
 *     description: Public endpoint to look up vehicle information by VIN number
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle Identification Number (17 characters)
 *         example: 1HGBH41JXMN109186
 *     responses:
 *       200:
 *         description: Vehicle found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle found
 *                 vehicle:
 *                   type: object
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.get('/vehicles/vin/:vin', vehicleController.getVehicleByVin);

/**
 * @swagger
 * /api/user/vehicles/{id}:
 *   put:
 *     tags: [Vehicle]
 *     summary: Update vehicle information
 *     description: Update vehicle information (license_plate or model_id) for the authenticated driver. VIN cannot be changed. Only the owner can update their own vehicles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the vehicle to update
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               license_plate:
 *                 type: string
 *                 description: New license plate number (optional)
 *                 example: 30B-67890
 *               model_id:
 *                 type: integer
 *                 description: New vehicle model ID (optional)
 *                 example: 2
 *           examples:
 *             updateLicensePlate:
 *               summary: Update license plate only
 *               value:
 *                 license_plate: "30B-67890"
 *             updateModelId:
 *               summary: Update model ID only
 *               value:
 *                 model_id: 2
 *             updateBoth:
 *               summary: Update both fields
 *               value:
 *                 license_plate: "30B-67890"
 *                 model_id: 2
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle updated successfully
 *                 vehicle:
 *                   type: object
 *                   description: Updated vehicle information including model details
 *       400:
 *         description: Bad request - no fields to update or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: At least one field (license_plate or model_id) is required to update
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Vehicle belongs to another driver
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You can only update your own vehicles
 *                 hint:
 *                   type: string
 *                   example: This vehicle belongs to another driver
 *       404:
 *         description: Vehicle not found or model_id not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found
 *                 vehicle_id:
 *                   type: string
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *       409:
 *         description: Conflict - License plate already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: License plate already exists
 *                 license_plate:
 *                   type: string
 *                   example: 30B-67890
 *       500:
 *         description: Internal server error
 */
router.put('/vehicles/:id', verifyToken, vehicleController.updateVehicle);

/**
 * @swagger
 * /api/user/vehicles/{id}:
 *   delete:
 *     tags: [Vehicle]
 *     summary: Delete a vehicle
 *     description: Delete a vehicle that belongs to the authenticated driver. Only the owner can delete their own vehicles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the vehicle to delete
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle deleted successfully
 *                 deleted_vehicle:
 *                   type: object
 *                   properties:
 *                     vehicle_id:
 *                       type: string
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *                     vin:
 *                       type: string
 *                       example: 1HGBH41JXMN109186
 *                     license_plate:
 *                       type: string
 *                       example: 30A-12345
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Vehicle belongs to another driver
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You can only delete your own vehicles
 *                 hint:
 *                   type: string
 *                   example: This vehicle belongs to another driver
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found
 *                 vehicle_id:
 *                   type: string
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *       409:
 *         description: Conflict - Vehicle is being used in other records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot delete vehicle
 *                 reason:
 *                   type: string
 *                   example: Vehicle is being used in swap records or bookings
 *                 hint:
 *                   type: string
 *                   example: Please contact admin to delete this vehicle
 *       500:
 *         description: Internal server error
 */
router.delete('/vehicles/:id', verifyToken, vehicleController.deleteVehicle);

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