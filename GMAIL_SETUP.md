# Hướng dẫn Setup Gmail SMTP cho Password Reset

## Bước 1: Bật 2-Step Verification (2FA)

1. Truy cập: https://myaccount.google.com/security
2. Tìm mục **"2-Step Verification"** (Xác minh 2 bước)
3. Click **"Get Started"** và làm theo hướng dẫn
4. Xác nhận bằng số điện thoại hoặc app Google Authenticator

## Bước 2: Tạo App Password

1. Sau khi bật 2FA, quay lại: https://myaccount.google.com/security
2. Tìm mục **"App passwords"** (Mật khẩu ứng dụng)
   - Nếu không thấy → chắc chắn 2FA đã được bật
3. Click **"App passwords"**
4. Chọn:
   - **App**: Other (Custom name) → Nhập: "EV Battery Swap Station"
   - **Device**: Other (Custom name) → Nhập: "Node.js Backend"
5. Click **"Generate"**
6. Copy mã 16 ký tự (dạng: `abcd efgh ijkl mnop`)

## Bước 3: Cập nhật file .env

Mở file `server/.env` và thêm/sửa:

```env
# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=your-email@gmail.com

# Development mode (để show token trong response)
NODE_ENV=development
```

**Lưu ý:**
- `EMAIL_PASS` là mã 16 ký tự từ App Password (bỏ dấu cách)
- `EMAIL_USER` và `EMAIL_FROM` là cùng 1 email Gmail

## Bước 4: Restart Server

```powershell
# Stop server (Ctrl+C)
# Then start lại
npm run dev
```

## Bước 5: Test gửi email

### Test với file test-email.js:

```powershell
node server/test-email.js
```

Kết quả mong đợi:
```
Testing email with config:
HOST: smtp.gmail.com
PORT: 587
USER: your-email@gmail.com
PASS: ***
✅ SMTP connection successful!
✅ Email sent!
Message ID: <xxxxx>
```

### Test với API forgot-password:

**POST** `http://localhost:3000/api/user/forgot-password`

Body:
```json
{
  "email": "existing-user@example.com"
}
```

**Kiểm tra:**
- Inbox Gmail của `existing-user@example.com`
- Có thể vào Spam nếu không thấy ở Inbox

## Troubleshooting

### Lỗi: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Nguyên nhân:** App Password chưa đúng hoặc chưa bật 2FA

**Giải pháp:**
1. Kiểm tra 2FA đã bật: https://myaccount.google.com/security
2. Tạo lại App Password mới
3. Copy chính xác 16 ký tự (bỏ dấu cách)
4. Restart server

### Lỗi: "Error: connect ECONNREFUSED"

**Nguyên nhân:** Port hoặc Host sai

**Giải pháp:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Email vào Spam

**Giải pháp:**
- Lần đầu gửi thường bị đánh dấu Spam
- Đánh dấu "Not Spam" để Gmail học
- Trong production nên dùng domain email riêng (SendGrid, AWS SES)

### Lỗi: "Less secure app access"

**Lưu ý:** Google đã tắt tính năng "Less secure app access" từ 5/2022. 
**PHẢI dùng App Password**, không thể dùng mật khẩu Gmail thông thường.

## Test Case đầy đủ

1. ✅ Test SMTP connection: `node server/test-email.js`
2. ✅ Test forgot-password API với email hợp lệ
3. ✅ Check Gmail inbox nhận được email
4. ✅ Copy token từ email
5. ✅ Test reset-password API với token
6. ✅ Check Gmail nhận confirmation email
7. ✅ Login với mật khẩu mới

## Production Setup (Khuyến nghị)

Trong production, nên dùng:
- **SendGrid** (free 100 emails/day): https://sendgrid.com
- **AWS SES** (cheap, scalable)
- **Mailgun** (developer-friendly)

Lý do: Gmail SMTP có giới hạn 500 emails/day và dễ bị mark spam.
