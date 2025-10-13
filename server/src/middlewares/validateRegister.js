function validateRegister(req, res, next) {
  const { username, email, password } = req.body || {};

  if (!email || !password || !username)
    return res.status(400).json({ message: 'username, email and password are required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ message: 'Invalid email format' });

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password))
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and include uppercase, lowercase, and numbers'
    });

  const { phone_number } = req.body || {};
  if (phone_number) {
    /**
     * Quy tắc:
     * - Bắt đầu bằng 0
     * - Sau đó là 9 hoặc 10 chữ số
     * - Các đầu số di động hợp lệ hiện nay gồm:
     *   03x, 05x, 07x, 08x, 09x
     */
    const vnPhoneRegex = /^(0(3[2-9]|5[25689]|7[06789]|8[1-9]|9[0-9]))\d{7}$/;
    if (!vnPhoneRegex.test(phone_number)) {
      return res.status(400).json({
        message:
          'Invalid Vietnamese phone number. Must start with 03, 05, 07, 08, or 09 and contain 10 digits'
      });
    }
  }

  next();
}

module.exports = validateRegister;
