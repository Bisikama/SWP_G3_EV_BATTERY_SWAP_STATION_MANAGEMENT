# Test Cases cho Password Validation

## 1. Test Reset Password với validation

### ✅ Valid Password
**POST** `http://localhost:3000/api/user/reset-password`
```json
{
  "token": "your-reset-token-here",
  "newPassword": "SecurePass123"
}
```
**Expected:** 200 - "Password reset successful"

---

### ❌ Password quá ngắn (< 8 ký tự)
```json
{
  "token": "your-reset-token",
  "newPassword": "Pass1"
}
```
**Expected:** 400 - "Password must be at least 8 characters long"

---

### ❌ Thiếu chữ hoa
```json
{
  "token": "your-reset-token",
  "newPassword": "password123"
}
```
**Expected:** 400 - "Password must contain at least one uppercase letter"

---

### ❌ Thiếu chữ thường
```json
{
  "token": "your-reset-token",
  "newPassword": "PASSWORD123"
}
```
**Expected:** 400 - "Password must contain at least one lowercase letter"

---

### ❌ Thiếu số
```json
{
  "token": "your-reset-token",
  "newPassword": "PasswordOnly"
}
```
**Expected:** 400 - "Password must contain at least one number"

---

### ❌ Password quá phổ biến
```json
{
  "token": "your-reset-token",
  "newPassword": "Password123"
}
```
**Expected:** 400 - "Password is too common. Please choose a stronger password"

---

### ❌ Chứa ký tự liên tiếp
```json
{
  "token": "your-reset-token",
  "newPassword": "Abc12345"
}
```
**Expected:** 400 - "Password should not contain sequential characters (e.g., abc, 123)"

---

### ❌ Thiếu token
```json
{
  "newPassword": "SecurePass123"
}
```
**Expected:** 400 - "Token and new password are required"

---

### ❌ Token không hợp lệ
```json
{
  "token": "invalid-token-xyz",
  "newPassword": "SecurePass123"
}
```
**Expected:** 404 - "Invalid or expired reset token"

---

## 2. Test Register với validation

### ✅ Valid Registration
**POST** `http://localhost:3000/api/user/register`
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "fullname": "John Doe",
  "phone_number": "0901234567"
}
```
**Expected:** 201 - Account created

---

### ❌ Weak Password
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password"
}
```
**Expected:** 400 - Password validation error

---

## 3. Test Complete Flow với Gmail

### Bước 1: Request Password Reset
**POST** `http://localhost:3000/api/user/forgot-password`
```json
{
  "email": "your-real-email@gmail.com"
}
```
**Expected:** 
- 200 - "Reset email sent if email exists"
- Check Gmail inbox/spam

---

### Bước 2: Lấy token từ email
- Mở email trong Gmail
- Click link reset hoặc copy token từ email
- Token có dạng: `a1b2c3d4e5f6...` (64 ký tự hex)

---

### Bước 3: Reset Password với validation
**POST** `http://localhost:3000/api/user/reset-password`
```json
{
  "token": "token-from-email",
  "newPassword": "MyNewSecure123"
}
```
**Expected:**
- 200 - "Password reset successful"
- Nhận confirmation email

---

### Bước 4: Login với mật khẩu mới
**POST** `http://localhost:3000/api/user/login`
```json
{
  "email": "your-real-email@gmail.com",
  "password": "MyNewSecure123"
}
```
**Expected:** 200 - Receive JWT token

---

## 4. Gmail Setup Checklist

- [ ] Bật 2-Step Verification: https://myaccount.google.com/security
- [ ] Tạo App Password: https://myaccount.google.com/apppasswords
- [ ] Copy 16-digit code (bỏ dấu cách)
- [ ] Update `.env`:
  ```env
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASS=abcdefghijklmnop
  EMAIL_FROM=your-email@gmail.com
  NODE_ENV=development
  ```
- [ ] Restart server: `npm run dev`
- [ ] Test SMTP: `node server/test-email.js`
- [ ] Test forgot-password API
- [ ] Check Gmail inbox (or spam)
- [ ] Copy token và test reset-password
- [ ] Verify login với password mới

---

## 5. Password Requirements Summary

✅ **Valid Password Must:**
- Be 8-128 characters long
- Contain at least one uppercase letter (A-Z)
- Contain at least one lowercase letter (a-z)
- Contain at least one number (0-9)
- Not be a common weak password
- Not contain sequential characters (abc, 123)

📝 **Examples:**
- ✅ `SecurePass123`
- ✅ `MyNewP@ss2024`
- ✅ `Strong1Password`
- ❌ `password` (too weak)
- ❌ `Pass123` (too short)
- ❌ `PASSWORD123` (no lowercase)
- ❌ `password123` (no uppercase)
- ❌ `Abc12345` (sequential: abc, 123)

---

## Troubleshooting

### Lỗi Gmail: "Invalid login"
1. Kiểm tra 2FA đã bật
2. Tạo lại App Password
3. Copy chính xác 16 ký tự
4. Restart server

### Email không nhận được
1. Check Spam folder
2. Verify EMAIL_USER/EMAIL_PASS trong .env
3. Test SMTP: `node server/test-email.js`
4. Check console log có lỗi

### Token expired
- Token chỉ có hiệu lực 1 giờ
- Request forgot-password lại để có token mới
