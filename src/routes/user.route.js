const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and retrieval
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [driver, staff, admin]
 *         description: Filter users by role
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email (partial match)
 *       - in: query
 *         name: fullname
 *         schema:
 *           type: string
 *         description: Filter by full name (partial match)
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       400:
 *         description: Invalid query parameters
 */
router.get('/',
    // verifyToken,
    // authorizeRole('admin'),
    userController.findAll
);

/**
 * @swagger
 * /api/users/id/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found successfully
 *       404:
 *         description: User not found
 */
router.get('/id/:id',
    verifyToken,
    authorizeRole('admin'), 
    userController.findById
);

/**
 * @swagger
 * /api/users/email/{email}:
 *   get:
 *     summary: Get user by email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: User email
 *     responses:
 *       200:
 *         description: User found successfully
 *       404:
 *         description: User not found
 */
router.get('/email/:email', 
    verifyToken,
    authorizeRole('admin'),
    userController.findByEmail
);

/**
 * @swagger
 * /api/users/staff:
 *   post:
 *     summary: Create a new staff account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullname
 *               - phone_number
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullname:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               citizen_id:
 *                 type: string
 *               driving_license:
 *                 type: string
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       400:
 *         description: Email or phone number already exists
 */
router.post('/staff',
    verifyToken,
    authorizeRole('admin'), 
    userController.createStaff
);

/**
 * @swagger
 * /api/users/driver/profile:
 *   put:
 *     summary: Update driver profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               citizen_id:
 *                 type: string
 *               driving_license:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver profile updated successfully
 *       404:
 *         description: Account not found
 */
router.put('/driver/profile', 
    verifyToken,
    authorizeRole('driver'),
    userController.updateDriver
);

/**
 * @swagger
 * /api/users/driver/password:
 *   put:
 *     summary: Update driver password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Password validation error
 *       404:
 *         description: Account not found
 */
router.put('/driver/password',
    verifyToken,
    authorizeRole('driver'), 
    userController.updateDriverPassword
);

module.exports = router;
