// src/middlewares/validateRegister.js
const { validatePassword } = require('./validatePassword');

function validateRegister(req, res, next) {
  const { username, email, password } = req.body || {};

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ message: 'Invalid email format' });

  // Use shared password validation
  validatePassword(req, res, next);
}

module.exports = validateRegister;
