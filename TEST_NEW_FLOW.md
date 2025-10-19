# 🎯 NEW SIMPLIFIED VERIFICATION FLOW

## ✅ Thay đổi so với phiên bản cũ

### **Phiên bản CŨ (Phức tạp)**
- Request verification → Trả về **3 mã số** (client hiển thị 3 buttons)
- Email gửi 3 mã, chỉ 1 mã đúng
- User chọn 1 trong 3 mã
- Reset password dùng **token link** dài

### **Phiên bản MỚI (Đơn giản)**
- Request verification → Chỉ trả về **message thành công**
- Email gửi **1 mã 6 chữ số** duy nhất
- User nhập mã vào input field
- Reset password dùng **mã 6 số** giống như verification

---

## 📧 1. EMAIL VERIFICATION FLOW (Đăng ký tài khoản)

### **Step 1: Request Verification Code**
```bash
POST http://localhost:3000/api/user/request-verification
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "message": "Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
}
```

**Email sẽ chứa:**
```
🔑 MÃ XÁC THỰC CỦA BẠN
┌─────────────┐
│   123456    │  ← Mã 6 số này
└─────────────┘
⏰ Mã có hiệu lực trong 10 phút
```

---

### **Step 2: Verify Email with Code**
```bash
POST http://localhost:3000/api/user/verify-email
Content-Type: application/json

{
  "email": "test@example.com",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "message": "Email verified successfully! You can now complete your registration.",
  "verified": true
}
```

**Response (Error - Wrong Code):**
```json
{
  "message": "Invalid verification code. Please try again."
}
```

**Response (Error - Expired):**
```json
{
  "message": "Verification code has expired. Please request a new code."
}
```

---

### **Step 3: Complete Registration**
```bash
POST http://localhost:3000/api/user/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "fullname": "Nguyen Van A",
  "phone_number": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "payload": {
    "account": {
      "account_id": "uuid-here",
      "email": "test@example.com",
      "fullname": "Nguyen Van A",
      "phone_number": "0123456789",
      "permission": "driver",
      "status": "active"
    }
  }
}
```

---

## 🔐 2. PASSWORD RESET FLOW

### **Step 1: Request Reset Code**
```bash
POST http://localhost:3000/api/user/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
}
```

**Email sẽ chứa:**
```
🔑 MÃ XÁC THỰC ĐẶT LẠI MẬT KHẨU
┌─────────────┐
│   654321    │  ← Mã 6 số này
└─────────────┘
⏰ Mã có hiệu lực trong 10 phút
```

---

### **Step 2: Reset Password with Code**
```bash
POST http://localhost:3000/api/user/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "654321",
  "newPassword": "NewSecurePass456!"
}
```

**Response (Success):**
```json
{
  "message": "Đặt lại mật khẩu thành công"
}
```

**Response (Error - Wrong Code):**
```json
{
  "message": "Mã xác thực không hợp lệ"
}
```

**Response (Error - Expired):**
```json
{
  "message": "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới."
}
```

**Confirmation Email:**
User sẽ nhận email xác nhận:
```
✅ Mật khẩu đã được thay đổi
🕒 Thời gian: 16/10/2025 10:30:45
📧 Email: user@example.com
```

---

## 🎨 Frontend Implementation Guide

### **1. Registration Flow**

```jsx
// Step 1: Request verification
const requestVerification = async (email) => {
  const response = await fetch('/api/user/request-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  
  if (response.ok) {
    // Show message: "Kiểm tra email để lấy mã xác thực"
    setStep('verify');
  }
};

// Step 2: Verify with code
const verifyEmail = async (email, code) => {
  const response = await fetch('/api/user/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  
  if (response.ok) {
    // Show: "Email đã xác thực! Tiếp tục điền thông tin"
    setStep('complete-registration');
  } else {
    // Show error: "Mã không đúng"
  }
};

// Step 3: Complete registration
const completeRegistration = async (formData) => {
  const response = await fetch('/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  if (response.ok) {
    // Redirect to login
  }
};
```

---

### **2. Password Reset Flow**

```jsx
// Step 1: Request reset code
const requestReset = async (email) => {
  const response = await fetch('/api/user/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (response.ok) {
    // Show: "Kiểm tra email để lấy mã xác thực"
    setStep('enter-code');
  }
};

// Step 2: Reset with code
const resetPassword = async (email, code, newPassword) => {
  const response = await fetch('/api/user/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword })
  });
  
  if (response.ok) {
    // Show: "Mật khẩu đã được đặt lại thành công"
    // Redirect to login
  }
};
```

---

## 🗄️ Database Schema

### **EmailChallenges Table**
```sql
CREATE TABLE "EmailChallenges" (
  challenge_id UUID PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  hashed_code VARCHAR NOT NULL,        -- SHA256 hash của mã 6 số
  expires_at TIMESTAMP NOT NULL,       -- Hết hạn sau 10 phút
  used BOOLEAN DEFAULT false,          -- Đã sử dụng chưa
  purpose VARCHAR NOT NULL,            -- 'register' hoặc 'reset_password'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_purpose_used ON "EmailChallenges"(email, purpose, used);
CREATE INDEX idx_expires_at ON "EmailChallenges"(expires_at);
```

---

## 📝 UI Components

### **Input for 6-Digit Code**

```jsx
<div className="verification-code-input">
  <label>Nhập mã xác thực (6 số)</label>
  <input
    type="text"
    maxLength="6"
    pattern="[0-9]{6}"
    placeholder="123456"
    value={code}
    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
  />
  <button onClick={() => verifyEmail(email, code)}>
    Xác thực
  </button>
</div>
```

**Hoặc sử dụng 6 ô riêng biệt:**
```jsx
<div className="code-boxes">
  {[0,1,2,3,4,5].map(i => (
    <input
      key={i}
      type="text"
      maxLength="1"
      pattern="[0-9]"
      value={code[i] || ''}
      onChange={(e) => handleCodeChange(i, e.target.value)}
      onKeyDown={(e) => handleKeyDown(i, e)}
    />
  ))}
</div>
```

---

## ⚠️ Security Notes

1. **Mã chỉ có hiệu lực 10 phút**
2. **Mỗi lần request mới sẽ vô hiệu hóa mã cũ**
3. **Mã được hash bằng SHA256 trong database**
4. **Sau khi verify thành công, mã được đánh dấu `used = true`**
5. **User có thể request mã mới nếu hết hạn**

---

## 🧪 Testing với Swagger

Truy cập: **http://localhost:3000/api-docs**

### Test Registration:
1. `/api/user/request-verification` - POST email
2. Check Gmail → copy mã 6 số
3. `/api/user/verify-email` - POST email + code
4. `/api/user/register` - POST thông tin đầy đủ

### Test Password Reset:
1. `/api/user/forgot-password` - POST email
2. Check Gmail → copy mã 6 số
3. `/api/user/reset-password` - POST email + code + newPassword

---

## 📧 Email Configuration

File `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=vinstationvippro@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM=VinStation Support <vinstationvippro@gmail.com>
FRONTEND_URL=http://localhost:3001
```

---

## ✨ Key Benefits

✅ **Đơn giản hơn cho user** - Chỉ cần nhập 1 mã thay vì chọn 1 trong 3
✅ **An toàn hơn** - Mã được gửi trực tiếp qua email, không exposed trong API response
✅ **Dễ implement** - Frontend chỉ cần 1 input field cho mã
✅ **Consistent UX** - Cùng flow cho cả register và reset password
✅ **Better security** - Mã ngắn hạn (10 phút) và one-time use

---

## 🔄 Cleanup Job (Optional)

Tạo cron job để xóa các mã đã hết hạn:

```javascript
// cleanup-challenges.js
const { EmailChallenge } = require('./models');

async function cleanupExpiredChallenges() {
  const deleted = await EmailChallenge.destroy({
    where: {
      expires_at: { [Op.lt]: new Date() }
    }
  });
  console.log(`🗑️ Cleaned up ${deleted} expired challenges`);
}

// Run every hour
setInterval(cleanupExpiredChallenges, 60 * 60 * 1000);
```
