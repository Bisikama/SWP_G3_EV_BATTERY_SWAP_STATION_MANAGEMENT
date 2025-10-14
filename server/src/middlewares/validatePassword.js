/**
 * Middleware to validate password strength
 * Password must:
 * - Be at least 8 characters long
 * - Contain at least one uppercase letter
 * - Contain at least one lowercase letter
 * - Contain at least one number
 * - Optionally contain special characters
 */
function validatePassword(req, res, next) {
  const { newPassword, password } = req.body || {};
  
  // Check which field contains the password (newPassword for reset, password for register)
  const passwordToValidate = newPassword || password;
  
  if (!passwordToValidate) {
    return res.status(400).json({ 
      message: 'Password is required' 
    });
  }

  // Minimum length check
  if (passwordToValidate.length < 8) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long'
    });
  }

  // Maximum length check (prevent DoS)
  if (passwordToValidate.length > 128) {
    return res.status(400).json({
      message: 'Password must not exceed 128 characters'
    });
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(passwordToValidate)) {
    return res.status(400).json({
      message: 'Password must contain at least one uppercase letter'
    });
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(passwordToValidate)) {
    return res.status(400).json({
      message: 'Password must contain at least one lowercase letter'
    });
  }

  // Check for number
  if (!/\d/.test(passwordToValidate)) {
    return res.status(400).json({
      message: 'Password must contain at least one number'
    });
  }

  // Optional: Check for special characters (uncomment if needed)
  // if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordToValidate)) {
  //   return res.status(400).json({
  //     message: 'Password must contain at least one special character'
  //   });
  // }

  // Check for common weak passwords
  const weakPasswords = [
    'password', 'Password1', '12345678', 'Abcd1234', 
    'Qwerty123', 'Admin123', 'Welcome1', 'Password123'
  ];
  
  if (weakPasswords.includes(passwordToValidate)) {
    return res.status(400).json({
      message: 'Password is too common. Please choose a stronger password'
    });
  }

  // Check for sequential characters (optional)
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(passwordToValidate);
  if (hasSequential) {
    return res.status(400).json({
      message: 'Password should not contain sequential characters (e.g., abc, 123)'
    });
  }

  next();
}

/**
 * Simplified validation for reset password
 * Only checks basic requirements
 */
function validateResetPassword(req, res, next) {
  const { newPassword } = req.body || {};
  
  if (!newPassword) {
    return res.status(400).json({ 
      message: 'New password is required' 
    });
  }

  // Basic strength check
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: 'Password must be 8-128 characters long and include uppercase, lowercase, and numbers'
    });
  }

  next();
}

module.exports = { validatePassword, validateResetPassword };
