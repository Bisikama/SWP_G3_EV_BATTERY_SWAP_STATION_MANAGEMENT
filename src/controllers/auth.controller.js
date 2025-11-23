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
 * Controller yêu cầu reset password - Step 1 của password recovery flow
 * 
 * Password Reset Flow (2 steps):
 * 1. requestPasswordReset() - Gửi OTP code qua email
 * 2. resetPassword() - Xác thực OTP và đổi password mới
 * 
 * Security:
 * - Kiểm tra email có tồn tại trong hệ thống không
 * - OTP code 6 chữ số được hash bằng SHA-256 trước khi lưu database
 * - Code expire sau 10 phút
 * - Vô hiệu hóa tất cả OTP cũ trước khi tạo mới (mỗi lần chỉ 1 OTP valid)
 * - Không tiết lộ OTP trong response (chỉ gửi qua email)
 * 
 * @param {Object} req.body - { email }
 * @returns {Object} Response xác nhận đã gửi email
 */
async function requestPasswordReset(req, res) {
	try {
		// Lấy email từ request body
		let { email } = req.body || {};
		
		// Normalize email để đảm bảo khớp với database
		// (database lưu tất cả email ở dạng lowercase, trimmed)
		email = email ? email.trim().toLowerCase() : email;
		
		// Validate email được cung cấp
		if (!email) {
			return res.status(400).json({ message: 'Email is required' });
		}

		// Kiểm tra email có tồn tại trong hệ thống không
		// Quan trọng: Chỉ gửi reset code cho email đã đăng ký
		// Tránh spam và bảo vệ privacy (không cho attacker biết email có đăng ký hay không)
		const account = await Account.findOne({ where: { email } });
		if (!account) {
			// Lưu ý: Trong production có thể trả về 200 với message chung chung
			// để không tiết lộ email có đăng ký hay không
			return res.status(404).json({ message: 'Email not found' });
		}

		// Generate mã OTP 6 chữ số (ví dụ: "123456")
		// generateVerificationCode() trả về random 6-digit string
		const resetCode = generateVerificationCode();
		
		// Hash OTP code bằng SHA-256 trước khi lưu vào database
		// Lý do: Nếu database bị leak, attacker không thể dùng OTP
		// createHash('sha256'): Tạo SHA-256 hasher
		// .update(resetCode): Input là plain OTP code
		// .digest('hex'): Output là hex string (64 characters)
		const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

		// Tính thời gian hết hạn (10 phút kể từ bây giờ)
		// Date.now(): Current timestamp in milliseconds
		// 10 * 60 * 1000: 10 minutes = 600 seconds = 600,000 ms
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

		// Vô hiệu hóa tất cả OTP reset password cũ chưa dùng của email này
		// Set used=true cho các challenge:
		// - Cùng email
		// - purpose='reset_password'
		// - used=false (chưa dùng)
		// Đảm bảo mỗi lần chỉ có 1 OTP valid, OTP cũ không dùng được nữa
		await EmailChallenge.update(
			{ used: true },
			{ where: { email, purpose: 'reset_password', used: false } }
		);

		// Tạo EmailChallenge record mới trong database
		await EmailChallenge.create({
			email,                    // Email yêu cầu reset
			hashed_code: hashedCode,  // SHA-256 hash của OTP code
			expires_at: expiresAt,    // Thời gian hết hạn (10 phút)
			used: false,              // Chưa được sử dụng
			purpose: 'reset_password' // Phân biệt với 'register' purpose
		});

		// Gửi email chứa OTP code cho user
		// sendPasswordResetEmail() sử dụng email service (Resend/Nodemailer)
		// Chỉ gửi plain OTP qua email, không gửi hashed version
		const emailSent = await sendPasswordResetEmail(email, resetCode);
		if (!emailSent) {
			// Email failed nhưng OTP đã được lưu trong database
			// Log warning để admin biết có vấn đề với email service
			console.warn('Failed to send reset email, but code saved to DB');
		}

		// Trả về success message (không gồm OTP code vì bảo mật)
		// Client hiển thị message và redirect đến form nhập OTP
		return res.json({
			message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'
		});
	} catch (err) {
		// Log error để debug (chứa stack trace đầy đủ)
		console.error('Request password reset error', err);
		// Trả về generic error message (không tiết lộ chi tiết lỗi)
		return res.status(500).json({ message: 'Internal server error' });
	}
}

/**
 * Controller reset password với OTP code - Step 2 của password recovery flow
 * 
 * Flow:
 * 1. Lấy email, OTP code, và password mới từ request
 * 2. Hash OTP code và tìm trong EmailChallenge table
 * 3. Kiểm tra OTP có hết hạn chưa (expires_at)
 * 4. Hash password mới bằng bcrypt
 * 5. Update password_hash trong Accounts table
 * 6. Mark OTP là used (one-time use)
 * 7. Gửi confirmation email
 * 
 * Security:
 * - OTP phải chính xác (so sánh hash)
 * - OTP chưa hết hạn (kiểm tra expires_at)
 * - OTP chưa được sử dụng (used=false)
 * - Password mới được hash bằng bcrypt
 * - OTP chỉ dùng 1 lần (set used=true sau khi reset)
 * 
 * @param {Object} req.body - { email, code, newPassword }
 * @returns {Object} Response xác nhận reset thành công
 */
async function resetPassword(req, res) {
  try {
    // Lấy data từ request body
    let { email, code, newPassword } = req.body || {};
    
    // Normalize email để khớp với database
    email = email ? email.trim().toLowerCase() : email;
    
    // Validate tất cả required fields
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code and new password are required' });
    }

    // Hash OTP code để so sánh với database
    // Phải hash giống cách trong requestPasswordReset()
    // SHA-256 là deterministic: cùng input -> cùng output
    // Ví dụ: code="123456" -> hashedCode="8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Tìm EmailChallenge record khớp với:
    // - email: Email yêu cầu reset
    // - hashed_code: SHA-256 hash của OTP code user nhập
    // - purpose: 'reset_password' (phân biệt với register)
    // - used: false (chưa được sử dụng, one-time use)
    // - order: Lấy mới nhất (DESC = newest first)
    const challenge = await EmailChallenge.findOne({
      where: {
        email,
        hashed_code: hashedCode,
        purpose: 'reset_password',
        used: false
      },
      order: [['created_at', 'DESC']]
    });

    // Nếu không tìm thấy -> OTP code sai hoặc đã được sử dụng
    if (!challenge) {
      return res.status(404).json({ message: 'Mã xác thực không hợp lệ' });
    }

    // Kiểm tra OTP có hết hạn chưa
    // challenge.expires_at: Timestamp lúc OTP hết hạn (tạo lúc requestPasswordReset)
    // new Date(): Timestamp hiện tại
    // Nếu expires_at < hiện tại -> OTP đã quá 10 phút
    if (challenge.expires_at < new Date()) {
      return res.status(400).json({ message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    // Tìm account trong database theo email
    // Sử dụng challenge.email (email từ EmailChallenge record) thay vì req.body.email
    // Ví tin cậy hơn vì đã verify qua OTP
    const account = await Account.findOne({ where: { email: challenge.email } });
    if (!account) {
      // Trường hợp rất hiếm: EmailChallenge tồn tại nhưng account đã bị xóa
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    // Hash password mới bằng bcrypt
    // Giống với registration process:
    // - Generate random salt (SALT_ROUNDS = 10)
    // - Apply bcrypt algorithm 2^10 lần
    // - Output: Hash string chứa cả salt và hash result
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update password_hash trong database
    // Không lưu plain password, chệ lưu bcrypt hash
    account.password_hash = hash;
    await account.save(); // Sequelize save() lưu thay đổi vào database

    // Mark OTP challenge là đã sử dụng
    // One-time use: OTP này không thể dùng lại
    // Ngăn chặn replay attacks (attacker dùng lại OTP cũ)
    challenge.used = true;
    await challenge.save();

    // Gửi email xác nhận đã đổi password thành công
    // Quan trọng cho security awareness:
    // - User biết password đã thay đổi
    // - Nếu không phải user thay đổi -> biết account bị compromise
    await sendPasswordChangeConfirmation(account.email);

    // Trả về success message
    // Client có thể redirect user đến login page
    return res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    // Log error đầy đủ cho debugging
    console.error('Reset password error', err);
    // Trả về generic error (không tiết lộ internal details)
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Controller yêu cầu xác thực email - Step 1 của registration flow
 * 
 * Registration Flow (3 steps):
 * 1. requestEmailVerification() - Gửi OTP code qua email
 * 2. verifyEmailCode() - Xác thực OTP code
 * 3. register() - Tạo account với thông tin đầy đủ
 * 
 * Tại sao cần email verification:
 * - Xác nhận email thật sự thuộc về user
 * - Tránh spam registrations với email giả
 * - Đảm bảo user có thể nhận emails quan trọng (password reset, notifications)
 * 
 * Security:
 * - Kiểm tra email chưa được đăng ký
 * - OTP 6 chữ số được hash bằng SHA-256
 * - OTP expire sau 10 phút
 * - Vô hiệu hóa OTP cũ khi tạo mới
 * - Không tiết lộ OTP trong response
 * 
 * @param {Object} req.body - { email }
 * @returns {Object} Response xác nhận đã gửi email
 */
async function requestEmailVerification(req, res) {
	try {
		// Lấy email từ request body
		let { email } = req.body || {};
		
		// Normalize email để đảm bảo consistency
		// Tất cả emails trong hệ thống đều lowercase và trimmed
		email = email ? email.trim().toLowerCase() : email;
		
		// Validate email được cung cấp
		if (!email) {
			return res.status(400).json({ message: 'Email is required' });
		}

		// Kiểm tra email đã được đăng ký chưa
		// Không cho phép verify email đã có trong hệ thống
		// User nên dùng login thay vì register
		const exists = await Account.findOne({ where: { email } });
		if (exists) {
			return res.status(400).json({ message: 'Email already registered. Please login instead.' });
		}

		// Generate mã OTP 6 chữ số random (ví dụ: "847261")
		// generateVerificationCode() tạo random 6-digit string
		const code = generateVerificationCode();
		
		// Hash OTP code bằng SHA-256 trước khi lưu database
		// Security best practice: Không lưu plain OTP
		// Nếu database leak, attacker không biết OTP gốc
		const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
		
		// Tính thời gian hết hạn (10 phút từ bây giờ)
		// 10 * 60 * 1000 = 600,000 milliseconds = 10 minutes
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

		// Vô hiệu hóa tất cả OTP register cũ chưa dùng của email này
		// Set used=true cho EmailChallenge records với:
		// - Cùng email
		// - purpose='register'
		// - used=false
		// Đảm bảo mỗi lần chỉ có 1 OTP valid
		await EmailChallenge.update(
			{ used: true },
			{ where: { email, purpose: 'register', used: false } }
		);

		// Tạo EmailChallenge record mới
		await EmailChallenge.create({
			email,                   // Email yêu cầu verification
			hashed_code: hashedCode, // SHA-256 hash của OTP
			expires_at: expiresAt,   // Thời gian hết hạn (10 phút)
			used: false,             // Chưa được sử dụng
			purpose: 'register'      // Phân biệt với 'reset_password'
		});

		// Gửi email chứa OTP code cho user
		// sendVerificationEmail() sử dụng email service (Resend/Nodemailer)
		// Email chứa: OTP code, link kiểm tra spam folder, support contact
		const emailSent = await sendVerificationEmail(email, code);
		if (!emailSent) {
			// Email service failed nhưng OTP đã lưu trong DB
			// Admin cần kiểm tra email service configuration
			console.warn('Failed to send verification email, but code saved to DB');
		}

		// Trả về success message (không gồm OTP code vì bảo mật)
		// Client hiển thị message và redirect đến form nhập OTP
		return res.json({
			message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'
		});
	} catch (err) {
		// Log error đầy đủ cho debugging
		console.error('Request email verification error', err);
		// Trả về generic error message
		return res.status(500).json({ message: 'Internal server error' });
	}
}

/**
 * Controller xác thực OTP code - Step 2 của registration flow
 * 
 * Flow:
 * 1. Lấy email và OTP code từ request
 * 2. Kiểm tra email chưa được đăng ký (double-check)
 * 3. Tìm EmailChallenge record active
 * 4. Kiểm tra OTP có hết hạn chưa
 * 5. Hash OTP và so sánh với database
 * 6. Nếu khớp, mark challenge là used
 * 7. Trả về verified=true để client tiếp tục sang step 3 (register)
 * 
 * Security:
 * - Double-check email chưa đăng ký (race condition protection)
 * - Kiểm tra OTP expiration (10 phút)
 * - So sánh hash, không so sánh plain code
 * - Mark used=true ngay sau verify (one-time use, nhưng chưa tạo account)
 * 
 * @param {Object} req.body - { email, code }
 * @returns {Object} Response với verified flag
 */
async function verifyEmailCode(req, res) {
  try {
    // Lấy email và OTP code từ request
    let { email, code } = req.body || {};
    
    // Normalize email để khớp với database
    email = email ? email.trim().toLowerCase() : email;
    
    // Validate required fields
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    // Double-check email chưa được đăng ký
    // Tránh race condition: User mở 2 tab, 1 tab đăng ký xong rồi tab kia vẫn verify
    const account = await Account.findOne({ where: { email } });
    if (account) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    // Tìm EmailChallenge record active cho email này
    // where conditions:
    // - email: Email đang verify
    // - purpose: 'register' (phân biệt với reset_password)
    // - used: false (chưa được verify, còn valid)
    // - order: Lấy mới nhất (nếu user request nhiều lần)
    const challenge = await EmailChallenge.findOne({
      where: {
        email,
        purpose: 'register',
        used: false
      },
      order: [['created_at', 'DESC']]
    });

    // Nếu không tìm thấy -> chưa request verification hoặc đã verify rồi
    if (!challenge) {
      return res.status(404).json({ message: 'No verification request found. Please request verification first.' });
    }

    // Kiểm tra OTP có hết hạn chưa (10 phút)
    // Nếu expires_at < hiện tại -> OTP đã expired
    if (challenge.expires_at < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    // Hash OTP code user nhập và so sánh với hash trong database
    // SHA-256 là deterministic: same input -> same output
    // Ví dụ: code="123456" -> hashedCode luôn là "8d969eef..."
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    if (challenge.hashed_code !== hashedCode) {
      // Hash không khớp -> OTP sai
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // OTP chính xác! Mark challenge là đã sử dụng
    // used=true cho phép register() kiểm tra email đã được verify
    // Lưu ý: Chưa tạo account tại đây, chỉ mark verification thành công
    challenge.used = true;
    await challenge.save();

    // Trả về success response với verified flag
    // Client sẽ:
    // 1. Hiển thị success message
    // 2. Redirect/enable registration form (step 3)
    // 3. User điền thêm thông tin (password, fullname, phone) và gọi register()
    return res.json({ 
      message: 'Email verified successfully! You can now complete your registration.',
      verified: true // Flag cho frontend biết verify thành công
    });
  } catch (err) {
    // Log error đầy đủ cho debugging
    console.error('Verify email code error', err);
    // Trả về generic error message
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Export tất cả auth controllers để sử dụng trong routes
// Usage trong auth.route.js:
// const { login, register, logout, ... } = require('../controllers/auth.controller');
// router.post('/login', login);
// router.post('/register', verifyToken, register);
// etc.
module.exports = { login, register, logout, requestPasswordReset, resetPassword, requestEmailVerification, verifyEmailCode };