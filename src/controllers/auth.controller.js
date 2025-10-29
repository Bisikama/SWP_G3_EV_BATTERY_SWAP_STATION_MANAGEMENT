const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const { Account, EmailChallenge } = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeConfirmation } = require('../utils/emailService');


async function login(req, res) {
	const { email, password } = req.body || {};
	const token = await authService.authenticate({ email, password });
	const account = await userService.findByEmail(email);
	return res.status(200).json({
		success: true,
		payload: { token, account }
	});
}

// logout: add token to blacklist (expects Authorization: Bearer <token>)
async function logout(req, res) {
	const auth = req.headers.authorization || '';
	const parts = auth.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(400).json({ message: 'Invalid authorization header' });
	const token = parts[1];
	authService.logout(token);
	return res.status(200).json({
		success: true,
		message: 'Logged out'
	});
}

async function register(req, res) {
	const { email, password, fullname, phone_number } = req.body || {};
	const permission = 'driver';
	if (!email || !password) {
		return res.status(400).json({ message: 'Email and password are required' });
	}

	// Check if email already registered
	const exists = await Account.findOne({ where: { email } });
	if (exists) {
		return res.status(409).json({ message: 'Email already registered' });
	}

	// Check if email is verified via EmailChallenge
	const verifiedChallenge = await EmailChallenge.findOne({
		where: {
			email,
			purpose: 'register',
			used: true // Must be marked as used after successful verification
		},
		order: [['created_at', 'DESC']]
	});

	if (!verifiedChallenge) {
		return res.status(400).json({
			message: 'Email not verified. Please complete email verification first.',
			requiresVerification: true
		});
	}

	// Check if verification was recent (within 1 hour after verification)
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
	if (verifiedChallenge.created_at < oneHourAgo) {
		return res.status(400).json({
			message: 'Email verification expired. Please verify your email again.',
			requiresVerification: true
		});
	}

	// Create new account with full registration details
	const hash = await bcrypt.hash(password, SALT_ROUNDS);
	const newAccount = await Account.create({
		email,
		password_hash: hash,
		fullname: fullname || 'User',
		phone_number,
		permission,
		status: 'active'
	});

	const safeAccount = {
		account_id: newAccount.account_id,
		email: newAccount.email,
		fullname: newAccount.fullname,
		phone_number: newAccount.phone_number,
		permission: newAccount.permission,
		status: newAccount.status
	};
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
		const { email } = req.body || {};
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
    const { email, code, newPassword } = req.body || {};
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
		const { email } = req.body || {};
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
    const { email, code } = req.body || {};
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