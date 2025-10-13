const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../utils/tokenBlacklist');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: "Token has been logged out" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Lưu thông tin user vào req để middleware khác dùng tiếp
    req.user = {
      account_id: decoded.account_id,
      email: decoded.email,
      permission: decoded.permission,
    };

    next();
  });
}

function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.permission) {
      return res.status(403).json({ message: 'No permission information' });
    }

    if (!allowedRoles.includes(req.user.permission)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
}

module.exports = { verifyToken, authorizeRole };
