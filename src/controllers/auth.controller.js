// Import service xử lý authentication logic (verify credentials, generate JWT token)
const authService = require('../services/auth.service');

// Import service xử lý user-related operations (query user data)
const userService = require('../services/user.service');

// Import database models
// Account: Bảng lưu thông tin tài khoản (email, password_hash, role, etc.)
// EmailChallenge: Bảng lưu mã xác thực email (OTP) cho register/reset password
const { Account, EmailChallenge } = require('../models');

// Import bcrypt để hash password
// Bcrypt là thuật toán one-way hashing an toàn cho password
const bcrypt = require('bcrypt');

// Import crypto để hash verification code
// Sử dụng SHA-256 để hash OTP code trước khi lưu vào database
const crypto = require('crypto');

// Import email utilities
// generateVerificationCode: Tạo mã OTP 6 chữ số
// sendVerificationEmail: Gửi email cho đăng ký
// sendPasswordResetEmail: Gửi email reset password
// sendPasswordChangeConfirmation: Gửi email xác nhận đã đổi password
const { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeConfirmation } = require('../utils/emailService');

// Số vòng lặp để generate bcrypt salt
// 10 rounds = 2^10 = 1024 iterations, cân bằng giữa security và performance
const SALT_ROUNDS = 10;

/**
 * Controller xử lý đăng nhập
 * 
 * Flow:
 * 1. Lấy email và password từ request body
 * 2. Normalize email (trim space và lowercase)
 * 3. Gọi authService.authenticate() để verify credentials và tạo JWT token
 * 4. Lấy thông tin account từ database
 * 5. Trả về token và account info cho client
 * 
 * @param {Object} req.body - { email, password }
 * @returns {Object} Response với token và account info
 * @throws Error nếu credentials không hợp lệ (handled by authService)
 */
async function login(req, res) {
	// Destructure email và password từ request body
	// || {} để tránh error nếu req.body là undefined
	let { email, password } = req.body || {};
	
	// Normalize email để đảm bảo tính nhất quán:
	// - trim(): Loại bỏ khoảng trắng đầu/cuối (user có thể nhập nhầm)
	// - toLowerCase(): Chuyển sang chữ thường (email không phân biệt hoa/thường)
	// Ví dụ: "  Admin@Example.COM  " -> "admin@example.com"
	email = email ? email.trim().toLowerCase() : email;
	
	// Gọi authService để:
	// 1. Tìm account trong database theo email
	// 2. So sánh password với password_hash bằng bcrypt.compare()
	// 3. Nếu hợp lệ, generate JWT token với payload { account_id, email, role }
	// 4. Throw error nếu credentials sai
	const token = await authService.authenticate({ email, password });
	
	// Lấy thông tin đầy đủ của account từ database
	// userService.findByEmail() trả về account object (không có password_hash)
	const account = await userService.findByEmail(email);
	
	// Trả về response với:
	// - success: true (để frontend dễ check)
	// - payload: chứa token (để lưu vào localStorage/cookie) và account info (để hiển thị)
	return res.status(200).json({
		success: true,
		payload: { token, account }
	});
}

/**
 * Controller xử lý đăng xuất
 * 
 * Cơ chế: Thêm JWT token vào blacklist để vô hiệu hóa
 * - Token vẫn còn valid về mặt signature và expiration
 * - Nhưng bị reject bởi verifyToken middleware khi check blacklist
 * - Ngăn chặn việc tái sử dụng token sau khi logout
 * 
 * @param {Object} req.headers.authorization - Format: "Bearer <token>"
 * @returns {Object} Response xác nhận logout thành công
 */
async function logout(req, res) {
	// Lấy Authorization header từ request
	// || '' để tránh error nếu header không tồn tại
	const auth = req.headers.authorization || '';
	
	// Tách chuỗi "Bearer <token>" thành array ["Bearer", "<token>"]
	const parts = auth.split(' ');
	
	// Validate format của Authorization header:
	// - Phải có đúng 2 phần ("Bearer" và token)
	// - Phần đầu phải là chữ "Bearer"
	// Nếu không đúng format, trả về 400 Bad Request
	if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(400).json({ message: 'Invalid authorization header' });
	
	// Lấy token (phần thứ 2 sau "Bearer")
	const token = parts[1];
	
	// Gọi authService.logout() để add token vào blacklist
	// Blacklist thường được implement bằng:
	// - In-memory Set (development)
	// - Redis (production - persistent và distributed)
	authService.logout(token);
	
	// Trả về success response
	// Client nên xóa token khỏi localStorage/cookie sau khi nhận response này
	return res.status(200).json({
		success: true,
		message: 'Logged out'
	});
}

/**
 * Controller xử lý đăng ký tài khoản mới - Step 3 (sau khi đã verify email)
 * 
 * Registration Flow (3 steps):
 * 1. Client gọi requestEmailVerification() - gửi OTP qua email
 * 2. Client gọi verifyEmailCode() - xác thực OTP
 * 3. Client gọi register() - tạo account với thông tin đầy đủ
 * 
 * Security:
 * - Email phải được verify trước (check EmailChallenge với used=true)
 * - Password được hash bằng bcrypt với SALT_ROUNDS=10
 * - Phone number được validate theo format Việt Nam
 * - Response không bao gồm password_hash
 * 
 * @param {Object} req.body - { email, password, fullname, phone_number }
 * @returns {Object} Response với account info (không có password)
 */
async function register(req, res) {
	// Destructure các fields từ request body
	let { email, password, fullname, phone_number } = req.body || {};
	
	// Normalize email để đảm bảo tính nhất quán
	// Tất cả email trong database đều lowercase và không có space thừa
	email = email ? email.trim().toLowerCase() : email;
	
	// Mặc định role là 'driver' cho user đăng ký
	// Admin accounts được tạo trực tiếp trong database hoặc qua admin panel
	const role = 'driver';
	
	// Validate required fields
	// Email và password là bắt buộc để tạo account
	if (!email || !password) {
		return res.status(400).json({ message: 'Email and password are required' });
	}

	// Validate phone number format cho số điện thoại Việt Nam
	// Regex pattern giải thích:
	// - ^(\+84|84|0): Bắt đầu bằng +84, 84, hoặc 0
	// - (3|5|7|8|9): Đầu số mạng (Viettel, Vinaphone, Mobifone, Vietnamobile)
	// - \d{8}$: Theo sau là 8 chữ số
	// 
	// Ví dụ hợp lệ:
	// - 0901234567 (10 chữ số, bắt đầu bằng 0)
	// - +84901234567 (country code với dấu +)
	// - 84901234567 (country code không có dấu +)
	const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)\d{8}$/;
	if (phone_number && !phoneRegex.test(phone_number)) {
		return res.status(400).json({ 
			message: 'Invalid phone number format. Expected format: 0901234567, +84901234567, or 84901234567' 
		});
	}

	// Kiểm tra email đã được đăng ký chưa
	// Tìm account trong database với email này
	const exists = await Account.findOne({ where: { email } });
	if (exists) {
		// Trả về 409 Conflict nếu email đã tồn tại
		return res.status(409).json({ message: 'Email already registered' });
	}

	// Kiểm tra email đã được verify chưa (2-step verification)
	// Tìm EmailChallenge record với:
	// - email: Email đang đăng ký
	// - purpose: 'register' (phân biệt với 'reset_password')
	// - used: true (đã được verify thành công ở verifyEmailCode())
	// - order: Lấy record mới nhất (DESC = descending)
	const verifiedChallenge = await EmailChallenge.findOne({
		where: {
			email,
			purpose: 'register',
			used: true // Phải được mark là used sau khi verify code thành công
		},
		order: [['created_at', 'DESC']]
	});

	// Nếu không tìm thấy verified challenge, email chưa được verify
	if (!verifiedChallenge) {
		return res.status(400).json({
			message: 'Email not verified. Please complete email verification first.',
			requiresVerification: true // Flag để frontend biết cần redirect đến verification page
		});
	}

	// Kiểm tra verification có còn valid không (trong vòng 1 giờ)
	// Tránh trường hợp user verify email rồi để quá lâu mới đăng ký
	// Security reason: Email có thể bị compromise trong thời gian chờ
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour = 60 minutes * 60 seconds * 1000 ms
	if (verifiedChallenge.created_at < oneHourAgo) {
		// Verification đã quá 1 giờ, yêu cầu verify lại
		return res.status(400).json({
			message: 'Email verification expired. Please verify your email again.',
			requiresVerification: true
		});
	}

	// Tạo account mới trong database
	// Step 1: Hash password bằng bcrypt
	// bcrypt.hash() thực hiện:
	// 1. Generate random salt (dựa vào SALT_ROUNDS)
	// 2. Mix salt với password
	// 3. Apply bcrypt algorithm 2^10 = 1024 lần
	// 4. Trả về hash string chứa cả salt và hash result
	// Hash này không thể reverse (one-way function)
	const hash = await bcrypt.hash(password, SALT_ROUNDS);
	
	// Step 2: Tạo record mới trong Accounts table
	const newAccount = await Account.create({
		email,                              // Email đã normalized (lowercase, trimmed)
		password_hash: hash,                // Bcrypt hash, không lưu plain password
		fullname: fullname || 'User',       // Default là 'User' nếu không cung cấp
		phone_number,                       // Đã được validate ở trên
		role,                               // Mặc định 'driver'
		status: 'active'                    // Account active ngay sau khi đăng ký
	});

	// Tạo safe account object để trả về cho client
	// KHÔNG BAO GỒM password_hash vì lý do bảo mật
	// Chỉ trả về các fields cần thiết cho frontend
	const safeAccount = {
		account_id: newAccount.account_id,
		email: newAccount.email,
		fullname: newAccount.fullname,
		phone_number: newAccount.phone_number,
		role: newAccount.role,
		status: newAccount.status
	};
	
	// Trả về 201 Created (resource mới được tạo thành công)
	// Client có thể redirect user đến login page hoặc tự động login
	return res.status(201).json({
		success: true,
		payload: { account: safeAccount }
	});
}

/**
 * Request password reset
 * Expected body: { email }
 * Sends email with 6-digit code
 * Responses:
 *  - 200: { message }
 *  - 400: invalid input
 *  - 404: email not found
 *  - 500: server error
 */
async function requestPasswordReset(req, res) {
	try {
		let { email } = req.body || {};
		// Normalize email: trim whitespace and convert to lowercase
		email = email ? email.trim().toLowerCase() : email;
		
		if (!email) {
			return res.status(400).json({ message: 'Email is required' });
		}

		// check if email exists
		const account = await Account.findOne({ where: { email } });
		if (!account) {
			return res.status(404).json({ message: 'Email not found' });
		}

		// Generate 6-digit reset code
		const resetCode = generateVerificationCode();
		const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

		// Set expiry time (10 minutes from now)
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

		// Invalidate any previous reset password challenges for this email
		await EmailChallenge.update(
			{ used: true },
			{ where: { email, purpose: 'reset_password', used: false } }
		);

		// Save to EmailChallenge table
		await EmailChallenge.create({
			email,
			hashed_code: hashedCode,
			expires_at: expiresAt,
			used: false,
			purpose: 'reset_password'
		});

		// Send email with 6-digit code
		const emailSent = await sendPasswordResetEmail(email, resetCode);
		if (!emailSent) {
			console.warn('Failed to send reset email, but code saved to DB');
		}

		return res.json({
			message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'
		});
	} catch (err) {
		console.error('Request password reset error', err);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

/**
 * Reset password with 6-digit code
 * Expected body: { email, code, newPassword }
 * Responses:
 *  - 200: { message: 'Password reset successful' }
 *  - 400: invalid input or expired code
 *  - 404: invalid code or email
 *  - 500: server error
 */
async function resetPassword(req, res) {
  try {
    let { email, code, newPassword } = req.body || {};
    // Normalize email: trim whitespace and convert to lowercase
    email = email ? email.trim().toLowerCase() : email;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code and new password are required' });
    }

    // Hash the code to compare with database
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Find challenge with this code
    const challenge = await EmailChallenge.findOne({
      where: {
        email,
        hashed_code: hashedCode,
        purpose: 'reset_password',
        used: false
      },
      order: [['created_at', 'DESC']]
    });

    if (!challenge) {
      return res.status(404).json({ message: 'Mã xác thực không hợp lệ' });
    }

    // Check if code expired
    if (challenge.expires_at < new Date()) {
      return res.status(400).json({ message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    // Find the account
    const account = await Account.findOne({ where: { email: challenge.email } });
    if (!account) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    // Hash new password
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update password
    account.password_hash = hash;
    await account.save();

    // Mark challenge as used
    challenge.used = true;
    await challenge.save();

    // Send confirmation email
    await sendPasswordChangeConfirmation(account.email);

    return res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Request email verification - Step 1 of registration
 * Expected body: { email }
 * Generates 6-digit code, sends via email
 * Returns: { message }
 * Responses:
 *  - 200: { message }
 *  - 400: invalid input or email already registered
 *  - 500: server error
 */
async function requestEmailVerification(req, res) {
	try {
		let { email } = req.body || {};
		// Normalize email: trim whitespace and convert to lowercase
		email = email ? email.trim().toLowerCase() : email;
		
		if (!email) {
			return res.status(400).json({ message: 'Email is required' });
		}

		// Check if email already registered
		const exists = await Account.findOne({ where: { email } });
		if (exists) {
			return res.status(400).json({ message: 'Email already registered. Please login instead.' });
		}

		// Generate 6-digit verification code
		const code = generateVerificationCode();
		
		// Hash the code for database storage
		const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
		
		// Set expiry time (10 minutes from now)
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

		// Invalidate any previous challenges for this email
		await EmailChallenge.update(
			{ used: true },
			{ where: { email, purpose: 'register', used: false } }
		);

		// Create new challenge in EmailChallenge table
		await EmailChallenge.create({
			email,
			hashed_code: hashedCode,
			expires_at: expiresAt,
			used: false,
			purpose: 'register'
		});

		// Send email with verification code
		const emailSent = await sendVerificationEmail(email, code);
		if (!emailSent) {
			console.warn('Failed to send verification email, but code saved to DB');
		}

		return res.json({
			message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'
		});
	} catch (err) {
		console.error('Request email verification error', err);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

/**
 * Verify email code - Step 2 of registration
 * Expected body: { email, code }
 * Verifies the user selected correct code
 * Responses:
 *  - 200: { message: 'Email verified successfully', verified: true }
 *  - 400: invalid code or expired
 *  - 404: email not found
 *  - 500: server error
 */
async function verifyEmailCode(req, res) {
  try {
    let { email, code } = req.body || {};
    // Normalize email: trim whitespace and convert to lowercase
    email = email ? email.trim().toLowerCase() : email;
    
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    // Check if email already registered
    const account = await Account.findOne({ where: { email } });
    if (account) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    // Find active challenge for this email
    const challenge = await EmailChallenge.findOne({
      where: {
        email,
        purpose: 'register',
        used: false
      },
      order: [['created_at', 'DESC']]
    });

    if (!challenge) {
      return res.status(404).json({ message: 'No verification request found. Please request verification first.' });
    }

    // Check if code expired
    if (challenge.expires_at < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    // Hash the provided code and compare
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (challenge.hashed_code !== hashedCode) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // Mark challenge as used
    challenge.used = true;
    await challenge.save();

    return res.json({ 
      message: 'Email verified successfully! You can now complete your registration.',
      verified: true
    });
  } catch (err) {
    console.error('Verify email code error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { login, register, logout, requestPasswordReset, resetPassword, requestEmailVerification, verifyEmailCode };