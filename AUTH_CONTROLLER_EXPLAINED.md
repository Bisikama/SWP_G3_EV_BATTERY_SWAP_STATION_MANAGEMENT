# AUTH CONTROLLER - Chi tiết giải thích

## 📚 Tổng quan

File `auth.controller.js` quản lý tất cả các chức năng xác thực (authentication) của hệ thống:
- Đăng nhập (Login)
- Đăng ký (Register) với xác thực email 2 bước
- Đăng xuất (Logout)
- Quên mật khẩu (Password Reset) với xác thực email

---

## 🔧 Dependencies (Import)

```javascript
const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const { Account, EmailChallenge } = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeConfirmation } = require('../utils/emailService');
const SALT_ROUNDS = 10;
```

### Giải thích từng import:

| Import | Mục đích |
|--------|----------|
| `authService` | Xác thực user (verify email/password), tạo JWT token |
| `userService` | Lấy thông tin user từ database |
| `Account` | Model Sequelize cho bảng Accounts |
| `EmailChallenge` | Model cho bảng EmailChallenges (lưu mã OTP) |
| `bcrypt` | Hash mật khẩu (one-way encryption) |
| `crypto` | Hash mã OTP trước khi lưu vào DB |
| `emailService` | Gửi email (verification, reset password) |
| `SALT_ROUNDS = 10` | Độ phức tạp của bcrypt hashing |

---

## 🔐 1. LOGIN Function

### Code:
```javascript
async function login(req, res) {
    let { email, password } = req.body || {};
    // Normalize email: trim whitespace and convert to lowercase
    email = email ? email.trim().toLowerCase() : email;
    
    const token = await authService.authenticate({ email, password });
    const account = await userService.findByEmail(email);
    return res.status(200).json({
        success: true,
        payload: { token, account }
    });
}
```

### 📝 Giải thích chi tiết:

#### **Bước 1: Lấy dữ liệu từ request**
```javascript
let { email, password } = req.body || {};
```
- Destructure `email` và `password` từ request body
- `|| {}` đảm bảo không bị lỗi nếu `req.body` là `undefined`

#### **Bước 2: Normalize email**
```javascript
email = email ? email.trim().toLowerCase() : email;
```
- **Tại sao?** Tránh trùng lặp email do space hoặc chữ hoa/thường
- `trim()`: Xóa space đầu/cuối → `" user@email.com "` → `"user@email.com"`
- `toLowerCase()`: Chuyển thành chữ thường → `"User@Email.COM"` → `"user@email.com"`

**Ví dụ:**
```javascript
// Input
email = "  User@Gmail.COM  "
password = "123456"

// After normalize
email = "user@gmail.com"
```

#### **Bước 3: Xác thực (Authentication)**
```javascript
const token = await authService.authenticate({ email, password });
```
- Gọi `authService.authenticate()` để:
  1. Kiểm tra email có tồn tại không
  2. So sánh password với hash trong DB (dùng bcrypt)
  3. **Nếu đúng:** Tạo JWT token
  4. **Nếu sai:** Throw error

**Flow trong authService:**
```
Input: { email, password }
    ↓
Find account by email
    ↓
Compare password với password_hash (bcrypt.compare)
    ↓
Valid? → Generate JWT token
Invalid? → Throw error
```

#### **Bước 4: Lấy thông tin account**
```javascript
const account = await userService.findByEmail(email);
```
- Lấy toàn bộ thông tin user (không bao gồm password_hash)
- Trả về: `{ account_id, email, fullname, phone_number, role, status }`

#### **Bước 5: Trả về response**
```javascript
return res.status(200).json({
    success: true,
    payload: { token, account }
});
```

**Response mẫu:**
```json
{
  "success": true,
  "payload": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "account": {
      "account_id": "ACC001",
      "email": "user@gmail.com",
      "fullname": "Nguyen Van A",
      "phone_number": "0901234567",
      "role": "driver",
      "status": "active"
    }
  }
}
```

### 🔄 Flow diagram:

```
POST /api/auth/login
{ email, password }
    ↓
Normalize email
    ↓
authService.authenticate()
    ├─ Valid → Generate JWT
    └─ Invalid → Error 401
    ↓
userService.findByEmail()
    ↓
Return { token, account }
```

### ⚠️ Error cases:

| Case | Status | Message |
|------|--------|---------|
| Email không tồn tại | 401 | Invalid credentials |
| Password sai | 401 | Invalid credentials |
| Account bị khóa | 403 | Account is inactive |

---

## 🚪 2. LOGOUT Function

### Code:
```javascript
async function logout(req, res) {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') 
        return res.status(400).json({ message: 'Invalid authorization header' });
    const token = parts[1];
    authService.logout(token);
    return res.status(200).json({
        success: true,
        message: 'Logged out'
    });
}
```

### 📝 Giải thích chi tiết:

#### **Bước 1: Lấy Authorization header**
```javascript
const auth = req.headers.authorization || '';
```
- Lấy header `Authorization` từ request
- Format chuẩn: `"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

#### **Bước 2: Parse token**
```javascript
const parts = auth.split(' ');
// Result: ["Bearer", "eyJhbGci..."]
```

#### **Bước 3: Validate format**
```javascript
if (parts.length !== 2 || parts[0] !== 'Bearer')
```
- Kiểm tra có đúng 2 phần: `Bearer` và `token`
- Phần đầu phải là `"Bearer"`

**Ví dụ lỗi:**
```javascript
// ❌ Sai format
"eyJhbGci..."           // Thiếu "Bearer"
"Token eyJhbGci..."     // Sai prefix
"Bearer"                // Thiếu token
```

#### **Bước 4: Blacklist token**
```javascript
authService.logout(token);
```
- Thêm token vào **blacklist** (Redis hoặc database)
- Token bị blacklist sẽ không thể dùng lại được

**Cơ chế blacklist:**
```
Token: "abc123"
    ↓
Add to blacklist
    ↓
Future requests with "abc123"
    ↓
Middleware check → Found in blacklist → Reject
```

### 🔄 Flow diagram:

```
POST /api/auth/logout
Headers: { Authorization: "Bearer <token>" }
    ↓
Parse header → Extract token
    ↓
Add token to blacklist
    ↓
Return success
```

---

## 📝 3. REGISTER Function

### Code overview:
```javascript
async function register(req, res) {
    // 1. Normalize email
    // 2. Validate phone number
    // 3. Check email not already registered
    // 4. Check email verified
    // 5. Hash password
    // 6. Create account
    // 7. Return safe account info
}
```

### 📝 Giải thích chi tiết từng bước:

#### **Bước 1-2: Lấy dữ liệu và normalize**
```javascript
let { email, password, fullname, phone_number } = req.body || {};
email = email ? email.trim().toLowerCase() : email;
const role = 'driver';
```
- Default role = `'driver'` cho người đăng ký mới
- Normalize email giống như login

#### **Bước 3: Validate phone number**
```javascript
const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)\d{8}$/;
if (phone_number && !phoneRegex.test(phone_number)) {
    return res.status(400).json({ 
        message: 'Invalid phone number format...' 
    });
}
```

**Regex breakdown:**
- `^(\+84|84|0)`: Bắt đầu bằng `+84`, `84`, hoặc `0`
- `(3|5|7|8|9)`: Đầu số di động VN (03x, 05x, 07x, 08x, 09x)
- `\d{8}`: 8 chữ số tiếp theo
- `$`: Kết thúc

**Ví dụ hợp lệ:**
```
✅ 0901234567
✅ +84901234567
✅ 84901234567
❌ 0111234567  (đầu 01 không phải di động)
❌ 090123456   (thiếu 1 số)
```

#### **Bước 4: Check email đã tồn tại chưa**
```javascript
const exists = await Account.findOne({ where: { email } });
if (exists) {
    return res.status(409).json({ message: 'Email already registered' });
}
```
- Status `409 Conflict`: Email đã tồn tại
- Tránh duplicate account

#### **Bước 5: Check email đã verify chưa** ⭐
```javascript
const verifiedChallenge = await EmailChallenge.findOne({
    where: {
        email,
        purpose: 'register',
        used: true  // ← Must be marked as used after verification
    },
    order: [['created_at', 'DESC']]
});

if (!verifiedChallenge) {
    return res.status(400).json({
        message: 'Email not verified. Please complete email verification first.',
        requiresVerification: true
    });
}
```

**Tại sao kiểm tra `used: true`?**
- User phải **hoàn thành bước verify email** trước
- Flow: Request OTP → Verify OTP (mark `used = true`) → Register
- Ngăn đăng ký với email chưa verify

#### **Bước 6: Check thời gian verify**
```javascript
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
if (verifiedChallenge.created_at < oneHourAgo) {
    return res.status(400).json({
        message: 'Email verification expired. Please verify your email again.',
        requiresVerification: true
    });
}
```
- Verification chỉ valid trong **1 giờ**
- Sau 1 giờ phải verify lại

#### **Bước 7: Hash password**
```javascript
const hash = await bcrypt.hash(password, SALT_ROUNDS);
```

**bcrypt.hash() hoạt động như thế nào?**
```
Input: "mypassword123", SALT_ROUNDS = 10
    ↓
Generate random salt
    ↓
Hash password + salt (2^10 = 1024 rounds)
    ↓
Output: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

**Tại sao dùng bcrypt?**
- **One-way**: Không thể decrypt (chỉ có thể so sánh)
- **Slow**: Tốn thời gian → Chống brute force attack
- **Salt**: Mỗi password có salt khác nhau

#### **Bước 8: Tạo account**
```javascript
const newAccount = await Account.create({
    email,
    password_hash: hash,
    fullname: fullname || 'User',
    phone_number,
    role,
    status: 'active'
});
```

#### **Bước 9: Trả về safe account (không có password)**
```javascript
const safeAccount = {
    account_id: newAccount.account_id,
    email: newAccount.email,
    fullname: newAccount.fullname,
    phone_number: newAccount.phone_number,
    role: newAccount.role,
    status: newAccount.status
};
return res.status(201).json({
    success: true,
    payload: { account: safeAccount }
});
```
- ⚠️ **KHÔNG BAO GIỜ** trả về `password_hash`
- Status `201 Created`: Tài khoản được tạo thành công

### 🔄 Full Registration Flow:

```
1. Request email verification
   POST /api/auth/request-email-verification
   { email }
        ↓
2. Receive OTP via email (6 digits)
        ↓
3. Verify OTP
   POST /api/auth/verify-email
   { email, code }
        ↓
   Mark EmailChallenge as used = true
        ↓
4. Register account (within 1 hour)
   POST /api/auth/register
   { email, password, fullname, phone_number }
        ↓
   Check email verified → Create account
```

---

## 🔑 4. REQUEST PASSWORD RESET

### Code:
```javascript
async function requestPasswordReset(req, res) {
    // 1. Validate email
    // 2. Check email exists
    // 3. Generate 6-digit code
    // 4. Hash code
    // 5. Save to EmailChallenge
    // 6. Send email
}
```

### 📝 Giải thích chi tiết:

#### **Bước 1-2: Validate và check email**
```javascript
let { email } = req.body || {};
email = email ? email.trim().toLowerCase() : email;

if (!email) {
    return res.status(400).json({ message: 'Email is required' });
}

const account = await Account.findOne({ where: { email } });
if (!account) {
    return res.status(404).json({ message: 'Email not found' });
}
```

#### **Bước 3: Generate OTP**
```javascript
const resetCode = generateVerificationCode();
```
- `generateVerificationCode()` tạo 6 số ngẫu nhiên
- Ví dụ: `"123456"`, `"987654"`

#### **Bước 4: Hash code trước khi lưu DB**
```javascript
const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');
```

**Tại sao hash OTP?**
- Nếu hacker access database, không đọc được OTP gốc
- SHA-256 one-way hash

**Ví dụ:**
```javascript
resetCode = "123456"
hashedCode = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
```

#### **Bước 5: Set expiry time**
```javascript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
```
- OTP hết hạn sau **10 phút**
- `10 * 60 * 1000` = 10 minutes in milliseconds

#### **Bước 6: Invalidate old codes**
```javascript
await EmailChallenge.update(
    { used: true },
    { where: { email, purpose: 'reset_password', used: false } }
);
```
- Đánh dấu tất cả OTP cũ là `used = true`
- Chỉ OTP mới nhất valid

#### **Bước 7: Lưu OTP vào database**
```javascript
await EmailChallenge.create({
    email,
    hashed_code: hashedCode,
    expires_at: expiresAt,
    used: false,
    purpose: 'reset_password'
});
```

#### **Bước 8: Gửi email**
```javascript
const emailSent = await sendPasswordResetEmail(email, resetCode);
if (!emailSent) {
    console.warn('Failed to send reset email, but code saved to DB');
}
```
- Gửi OTP qua email (dùng Resend/Nodemailer)
- Nếu fail gửi email → vẫn lưu DB (user có thể retry)

### 📧 Email template:
```
Subject: Reset Your Password

Your password reset code is: 123456

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.
```

---

## 🔐 5. RESET PASSWORD

### Code:
```javascript
async function resetPassword(req, res) {
    // 1. Validate input
    // 2. Hash code and find challenge
    // 3. Check code valid and not expired
    // 4. Hash new password
    // 5. Update account
    // 6. Mark challenge as used
    // 7. Send confirmation email
}
```

### 📝 Giải thích chi tiết:

#### **Bước 1-2: Hash code và tìm challenge**
```javascript
const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

const challenge = await EmailChallenge.findOne({
    where: {
        email,
        hashed_code: hashedCode,
        purpose: 'reset_password',
        used: false
    },
    order: [['created_at', 'DESC']]
});
```
- Hash code user nhập vào
- So sánh với hashed code trong DB
- Chỉ lấy code chưa dùng (`used: false`)

#### **Bước 3: Check expiry**
```javascript
if (challenge.expires_at < new Date()) {
    return res.status(400).json({ 
        message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' 
    });
}
```

#### **Bước 4-5: Update password**
```javascript
const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
account.password_hash = hash;
await account.save();
```

#### **Bước 6: Mark challenge used**
```javascript
challenge.used = true;
await challenge.save();
```
- OTP chỉ dùng được **1 lần**

#### **Bước 7: Send confirmation**
```javascript
await sendPasswordChangeConfirmation(account.email);
```
- Thông báo user password đã thay đổi
- Security best practice

---

## 📧 6. EMAIL VERIFICATION FLOW

### Step 1: Request Verification

```javascript
async function requestEmailVerification(req, res) {
    // 1. Check email not registered yet
    // 2. Generate OTP
    // 3. Hash and save to DB
    // 4. Send email
}
```

### Step 2: Verify Code

```javascript
async function verifyEmailCode(req, res) {
    // 1. Check email not registered
    // 2. Find active challenge
    // 3. Check not expired
    // 4. Compare hashed code
    // 5. Mark as used
}
```

---

## 🔒 Security Best Practices

### 1. **Email Normalization**
```javascript
email = email ? email.trim().toLowerCase() : email;
```
- Tránh duplicate accounts do space/case sensitivity

### 2. **Password Hashing (bcrypt)**
```javascript
const hash = await bcrypt.hash(password, SALT_ROUNDS);
```
- One-way encryption
- Salt rounds = 10 (balance between security & performance)

### 3. **OTP Hashing (SHA-256)**
```javascript
const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
```
- OTP trong DB bị hash → Hacker không đọc được

### 4. **Time-limited Codes**
```javascript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
```
- OTP hết hạn sau 10 phút

### 5. **One-time Use**
```javascript
challenge.used = true;
await challenge.save();
```
- Mỗi OTP chỉ dùng được 1 lần

### 6. **Token Blacklisting**
```javascript
authService.logout(token);
```
- Logout = add token to blacklist

### 7. **Safe Response (No Password)**
```javascript
const safeAccount = {
    account_id: newAccount.account_id,
    email: newAccount.email,
    // ... (không có password_hash)
};
```

---

## 📊 Database Tables

### **Accounts Table**
```sql
CREATE TABLE Accounts (
    account_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    fullname VARCHAR,
    phone_number VARCHAR,
    role VARCHAR,
    status VARCHAR
);
```

### **EmailChallenges Table**
```sql
CREATE TABLE EmailChallenges (
    challenge_id SERIAL PRIMARY KEY,
    email VARCHAR,
    hashed_code VARCHAR,
    expires_at TIMESTAMP,
    used BOOLEAN,
    purpose VARCHAR, -- 'register' | 'reset_password'
    created_at TIMESTAMP
);
```

---

## 🔄 Complete User Journey

### **Registration Flow:**
```
1. User enters email
   ↓
2. POST /api/auth/request-email-verification
   → Generate OTP → Send email
   ↓
3. User receives email with 6-digit code
   ↓
4. POST /api/auth/verify-email { email, code }
   → Verify code → Mark as used
   ↓
5. POST /api/auth/register { email, password, fullname, phone }
   → Check verified → Create account
```

### **Login Flow:**
```
POST /api/auth/login { email, password }
    ↓
Normalize email
    ↓
Authenticate (check password)
    ↓
Generate JWT token
    ↓
Return { token, account }
```

### **Password Reset Flow:**
```
1. POST /api/auth/request-password-reset { email }
   → Generate OTP → Send email
   ↓
2. User receives email with 6-digit code
   ↓
3. POST /api/auth/reset-password { email, code, newPassword }
   → Verify code → Update password
```

---

## 🎯 Summary

| Function | Purpose | Security Features |
|----------|---------|-------------------|
| `login` | Đăng nhập | Email normalize, bcrypt verify |
| `logout` | Đăng xuất | Token blacklist |
| `register` | Đăng ký | Email verification, phone validation, password hashing |
| `requestPasswordReset` | Yêu cầu reset password | OTP hashing, expiry time |
| `resetPassword` | Reset password | OTP verification, one-time use |
| `requestEmailVerification` | Gửi OTP verify email | OTP hashing, expiry time |
| `verifyEmailCode` | Xác thực email | OTP comparison, one-time use |

---

**Created by:** BE_BaoNguyen  
**Date:** November 23, 2025  
**Version:** 1.0
