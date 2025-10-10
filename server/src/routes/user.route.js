const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Retrieve a list of users
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: John Doe
 */
router.get('/', userController.getAll);

// login route
router.post('/login', userController.login);

module.exports = router;