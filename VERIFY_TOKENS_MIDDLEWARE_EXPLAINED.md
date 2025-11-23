# Giải Thích Chi Tiết: verifyTokens.js Middleware

## Tổng Quan

File `verifyTokens.js` chứa hai middleware quan trọng để bảo vệ các API endpoint trong hệ thống:

1. **`verifyToken`**: Xác thực JWT token từ request header
2. **`authorizeRole`**: Phân quyền dựa trên role của user

---

## Dependencies

```javascript
const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../utils/tokenBlacklist');
const ApiError = require('../utils/ApiError');
```

### Giải Thích Dependencies:

- **`jsonwebtoken`**: Thư viện để tạo và xác thực JWT tokens
- **`tokenBlacklist`**: Module quản lý danh sách các token đã bị vô hiệu hóa (sau khi logout)
- **`ApiError`**: Class custom để tạo error responses có cấu trúc chuẩn

---

## 1. Middleware `verifyToken`

### Chức Năng

Middleware này xác thực JWT token từ Authorization header của HTTP request. Nếu token hợp lệ, middleware sẽ giải mã token và lưu thông tin user vào `req.user` để các middleware/controller tiếp theo sử dụng.

### Code Breakdown

```javascript
function verifyToken(req, res, next) {
```

- **Tham số**:
  - `req`: HTTP request object
  - `res`: HTTP response object
  - `next`: Function để chuyển control sang middleware tiếp theo

#### Bước 1: Lấy Token từ Authorization Header

```javascript
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
```

**Giải thích chi tiết:**

1. `req.headers['authorization']`: Lấy giá trị của Authorization header
   - Format chuẩn: `"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

2. `authHeader && authHeader.split(' ')[1]`:
   - **Short-circuit evaluation**: Nếu `authHeader` là `null/undefined`, trả về `undefined` (không gọi `.split()`)
   - **`split(' ')`**: Tách chuỗi thành array `["Bearer", "token_value"]`
   - **`[1]`**: Lấy phần tử thứ 2 (token value), bỏ qua chữ "Bearer"

**Ví dụ:**
```
Input:  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoxLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIn0.xyz123"
Output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoxLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIn0.xyz123"
```

#### Bước 2: Kiểm Tra Token Có Tồn Tại

```javascript
if (!token) {
  return res.status(401).json({ message: 'No token provided' });
}
```

**Giải thích:**

- **Status 401 Unauthorized**: Token không được gửi kèm trong request
- **`return`**: Dừng xử lý middleware, không gọi `next()`
- **Khi nào xảy ra**: Client gọi API mà không có Authorization header, hoặc header không đúng format

**Response example:**
```json
{
  "message": "No token provided"
}
```

#### Bước 3: Kiểm Tra Token Có Bị Blacklist (Đã Logout)

```javascript
if (tokenBlacklist.has(token)) {
  return res.status(401).json({ message: "Token has been logged out" });
}
```

**Giải thích chi tiết:**

- **`tokenBlacklist.has(token)`**: Kiểm tra token có trong danh sách đen không
- **Blacklist mechanism**: 
  - Khi user logout, token được thêm vào `tokenBlacklist` (thường là một Set hoặc cache)
  - Token vẫn có thể hợp lệ về mặt JWT signature, nhưng đã bị "revoke" bởi hệ thống
  - Điều này ngăn chặn việc tái sử dụng token sau khi logout

**Ví dụ flow:**
```
1. User login → nhận token ABC
2. User logout → token ABC được add vào tokenBlacklist
3. User cố gắng dùng token ABC lại → bị reject tại đây
```

**Response example:**
```json
{
  "message": "Token has been logged out"
}
```

#### Bước 4: Xác Thực Token với JWT

```javascript
jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
```

**Giải thích:**

- **`jwt.verify()`**: Hàm async xác thực JWT token
- **Tham số**:
  1. `token`: JWT token string cần verify
  2. `process.env.JWT_SECRET`: Secret key dùng để sign/verify token (phải giống với key dùng khi tạo token)
  3. `callback(err, decoded)`: Callback xử lý kết quả

**JWT Verification Process:**

1. **Kiểm tra structure**: Token có đúng 3 phần (header.payload.signature) không
2. **Verify signature**: Dùng JWT_SECRET để kiểm tra chữ ký, đảm bảo token không bị giả mạo
3. **Check expiration**: Kiểm tra token có hết hạn chưa (dựa vào field `exp` trong payload)
4. **Decode payload**: Nếu hợp lệ, trả về decoded data

#### Bước 4a: Xử Lý Token Không Hợp Lệ

```javascript
if (err) {
  return res.status(403).json({ message: 'Invalid or expired token' });
}
```

**Giải thích:**

- **Status 403 Forbidden**: Token được gửi nhưng không hợp lệ
- **Các trường hợp lỗi**:
  - Token signature không khớp (bị chỉnh sửa hoặc dùng sai JWT_SECRET)
  - Token đã hết hạn (`TokenExpiredError`)
  - Token format không đúng (`JsonWebTokenError`)
  - Token bị malformed

**Response example:**
```json
{
  "message": "Invalid or expired token"
}
```

**Lưu ý phân biệt Status Code:**
- **401 Unauthorized**: Không có token hoặc token bị blacklist (chưa authenticated)
- **403 Forbidden**: Có token nhưng không hợp lệ (authenticated failed)

#### Bước 4b: Lưu Thông Tin User vào Request

```javascript
req.user = {
  account_id: decoded.account_id,
  email: decoded.email,
  role: decoded.role,
};

next();
```

**Giải thích chi tiết:**

1. **`decoded`**: Object chứa payload đã được decode từ JWT token
   - Token được tạo trong `auth.controller.js` với payload này
   - Ví dụ payload:
     ```javascript
     {
       account_id: 1,
       email: "admin@example.com",
       role: "admin",
       iat: 1700000000,  // Issued At timestamp
       exp: 1700086400   // Expiration timestamp
     }
     ```

2. **`req.user = {...}`**: Gắn thông tin user vào request object
   - Các controller/middleware sau đó có thể truy cập `req.user` để biết user hiện tại
   - Chỉ lấy các field cần thiết (account_id, email, role), không lưu toàn bộ decoded

3. **`next()`**: Chuyển control sang middleware/controller tiếp theo trong chain
   - Không có `return` ở đây vì đây là trường hợp thành công cuối cùng

**Flow sau khi verify thành công:**
```
verifyToken (gắn req.user) 
  → authorizeRole (kiểm tra req.user.role) 
    → Controller (sử dụng req.user.account_id để query database)
```

---

## 2. Middleware `authorizeRole`

### Chức Năng

Middleware này kiểm tra xem user đã được xác thực có quyền truy cập vào endpoint hay không dựa trên role của họ. Đây là middleware phải được dùng **sau** `verifyToken`.

### Code Breakdown

```javascript
function authorizeRole(...allowedRoles) {
```

**Giải thích:**

- **`...allowedRoles`**: Rest parameter - nhận một hoặc nhiều roles được phép
- **Ví dụ sử dụng**:
  ```javascript
  router.get('/admin-only', verifyToken, authorizeRole('admin'), controller);
  router.put('/staff-or-admin', verifyToken, authorizeRole('admin', 'staff'), controller);
  ```

### Higher-Order Function Pattern

```javascript
return (req, res, next) => {
```

**Giải thích pattern:**

- `authorizeRole()` là **higher-order function** - function trả về function khác
- **Lý do thiết kế này**:
  1. Cho phép pass parameters (allowedRoles) vào middleware
  2. Trả về middleware function thực sự với signature `(req, res, next)`
  
**Ví dụ:**
```javascript
// Khi define route:
authorizeRole('admin', 'staff')  // Gọi function, trả về middleware function

// Khi request đến:
middleware(req, res, next)  // Express gọi middleware function được trả về
```

#### Bước 1: Kiểm Tra req.user Có Tồn Tại

```javascript
if (!req.user || !req.user.role) {
  throw new ApiError(403, 'Access denied: user role not found');
}
```

**Giải thích chi tiết:**

1. **`!req.user`**: Kiểm tra `req.user` có tồn tại không
   - Nếu `verifyToken` không được gọi trước, `req.user` sẽ là `undefined`
   - **Lỗi cấu hình route** nếu điều này xảy ra

2. **`!req.user.role`**: Kiểm tra role có trong user object không
   - Nếu token không chứa field `role` trong payload
   - Hoặc token bị corrupt một phần

3. **`throw new ApiError(403, 'Access denied: user role not found')`**:
   - **`throw`** thay vì `return res.json()`: Để error handling middleware xử lý centralized
   - **Status 403**: User đã authenticated nhưng thiếu thông tin role
   - **ApiError**: Custom error class có thể chứa thêm metadata

**Response được xử lý bởi error handling middleware:**
```json
{
  "statusCode": 403,
  "message": "Access denied: user role not found"
}
```

#### Bước 2: Kiểm Tra Role Có Được Phép Không

```javascript
if (!allowedRoles.includes(req.user.role)) {
  throw new ApiError(
    403,
    `Access denied: your role '${req.user.role}' is not allowed. Allowed role(s): ${allowedRoles.join(', ')}`
  );
}
```

**Giải thích chi tiết:**

1. **`allowedRoles.includes(req.user.role)`**: Kiểm tra role của user có trong danh sách allowed roles không
   - `allowedRoles`: Array các roles được phép, ví dụ `['admin', 'staff']`
   - `req.user.role`: Role của user hiện tại, ví dụ `'customer'`

2. **Error message động**:
   ```javascript
   `Access denied: your role '${req.user.role}' is not allowed. Allowed role(s): ${allowedRoles.join(', ')}`
   ```
   - **Template literal**: Tạo message chi tiết giúp debug
   - **`${req.user.role}`**: Hiển thị role hiện tại của user
   - **`${allowedRoles.join(', ')}`**: Hiển thị danh sách roles được phép

**Ví dụ error message:**
```
"Access denied: your role 'customer' is not allowed. Allowed role(s): admin, staff"
```

**Response example:**
```json
{
  "statusCode": 403,
  "message": "Access denied: your role 'customer' is not allowed. Allowed role(s): admin, staff"
}
```

#### Bước 3: Cho Phép Tiếp Tục Nếu Role Hợp Lệ

```javascript
next();
```

**Giải thích:**

- Nếu `req.user.role` có trong `allowedRoles`, gọi `next()` để chuyển sang controller
- Không cần return vì không có code nào sau `next()`

---

## Module Exports

```javascript
module.exports = { verifyToken, authorizeRole };
```

Export cả hai middleware để các route files khác có thể import và sử dụng.

---

## Cách Sử Dụng Trong Routes

### Ví Dụ 1: Endpoint Yêu Cầu Authentication

```javascript
const { verifyToken } = require('../middlewares/verifyTokens');

// Chỉ cần verify token, không cần kiểm tra role
router.get('/profile', verifyToken, profileController.getProfile);
```

**Flow:**
1. Request đến `/profile`
2. `verifyToken` chạy → verify JWT token
3. Nếu token hợp lệ, `req.user` được set
4. `profileController.getProfile` chạy, sử dụng `req.user.account_id` để lấy thông tin

### Ví Dụ 2: Endpoint Chỉ Dành Cho Admin

```javascript
const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');

// Chỉ admin mới được truy cập
router.delete('/users/:id', verifyToken, authorizeRole('admin'), adminController.deleteUser);
```

**Flow:**
1. Request đến `/users/123` với method DELETE
2. `verifyToken` chạy → verify JWT token, set `req.user`
3. `authorizeRole('admin')` chạy → kiểm tra `req.user.role === 'admin'`
4. Nếu không phải admin → throw error 403
5. Nếu là admin → `adminController.deleteUser` chạy

### Ví Dụ 3: Endpoint Cho Nhiều Roles

```javascript
// Admin và Staff đều được phép
router.put(
  '/stations/:id', 
  verifyToken, 
  authorizeRole('admin', 'staff'), 
  stationController.updateStation
);
```

**Flow:**
1. Request đến `/stations/5` với method PUT
2. `verifyToken` chạy → verify JWT token, set `req.user`
3. `authorizeRole('admin', 'staff')` chạy → kiểm tra `req.user.role` có phải 'admin' hoặc 'staff'
4. Nếu role là 'customer' → throw error 403
5. Nếu role là 'admin' hoặc 'staff' → `stationController.updateStation` chạy

### Ví Dụ 4: Endpoint Public (Không Cần Authentication)

```javascript
// Không dùng middleware nào
router.get('/stations', stationController.getAllStations);
```

**Flow:**
1. Request đến `/stations`
2. Không có middleware → `stationController.getAllStations` chạy trực tiếp
3. `req.user` sẽ là `undefined`

---

## Security Best Practices

### 1. Token Storage (Client-Side)

**Recommendation:**
```javascript
// ✅ GOOD: Store in HttpOnly cookie (server-side set)
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: true,  // Chỉ gửi qua HTTPS
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000  // 24 hours
});

// ⚠️ ACCEPTABLE: Store in localStorage (client-side)
localStorage.setItem('token', jwtToken);

// ❌ BAD: Store in cookie không có httpOnly
document.cookie = `token=${jwtToken}`;  // Vulnerable to XSS
```

**Lưu ý:**
- **HttpOnly cookie**: An toàn nhất, không thể truy cập từ JavaScript (chống XSS)
- **localStorage**: Dễ sử dụng nhưng vulnerable to XSS attacks
- **Regular cookie**: Dễ bị đánh cắp qua XSS

### 2. JWT Secret Management

**Recommendations:**
```javascript
// ✅ GOOD: Dùng environment variable
const JWT_SECRET = process.env.JWT_SECRET;

// ❌ BAD: Hardcode trong code
const JWT_SECRET = 'my-secret-key-123';  // NEVER DO THIS
```

**Best practices:**
- JWT_SECRET phải là chuỗi random dài ít nhất 32 ký tự
- Không commit vào Git
- Thay đổi khi deploy lên production
- Dùng key management service (AWS KMS, Azure Key Vault) cho production

### 3. Token Expiration

**Recommendations:**
```javascript
// ✅ GOOD: Set expiration time
const token = jwt.sign(
  { account_id, email, role },
  JWT_SECRET,
  { expiresIn: '24h' }  // Token expire sau 24 giờ
);

// ⚠️ RISKY: Long expiration
{ expiresIn: '30d' }  // Token sống quá lâu, rủi ro nếu bị leak

// ❌ BAD: No expiration
const token = jwt.sign({ account_id, email, role }, JWT_SECRET);  // Token vĩnh viễn
```

**Best practices:**
- Access token: Ngắn (15 phút - 24 giờ)
- Refresh token: Dài hơn (7-30 ngày)
- Implement refresh token mechanism cho UX tốt hơn

### 4. Token Blacklist Management

**Current Implementation:**
```javascript
// Trong tokenBlacklist.js (giả sử)
const tokenSet = new Set();

module.exports = {
  add: (token) => tokenSet.add(token),
  has: (token) => tokenSet.has(token),
  remove: (token) => tokenSet.delete(token)
};
```

**Limitations:**
- **In-memory Set**: Mất data khi restart server
- **No expiration cleanup**: Set sẽ lớn dần theo thời gian
- **Not distributed**: Không work với multiple server instances

**Recommended Solution:**
```javascript
// Dùng Redis để store blacklist
const redis = require('redis');
const client = redis.createClient();

module.exports = {
  add: async (token, expiresIn) => {
    // Token tự động expire sau expiresIn seconds
    await client.setex(token, expiresIn, '1');
  },
  has: async (token) => {
    const exists = await client.exists(token);
    return exists === 1;
  }
};
```

**Benefits:**
- Persistent storage (không mất khi restart)
- Auto cleanup (Redis TTL tự động xóa expired tokens)
- Distributed (nhiều server cùng share Redis)

### 5. Error Message Security

**Current Code:**
```javascript
// ⚠️ Current implementation reveals token status
return res.status(403).json({ message: 'Invalid or expired token' });
```

**Security Consideration:**
- Message này hợp lý, không tiết lộ thông tin nhạy cảm
- Không nên reveal chi tiết như "Token signature invalid" vs "Token expired" vì giúp attacker debug

**Best practice:**
```javascript
// ✅ Generic message
return res.status(403).json({ message: 'Authentication failed' });

// ✅ Log chi tiết vào server logs (không gửi cho client)
console.error('JWT verification failed:', err.message);
return res.status(403).json({ message: 'Authentication failed' });
```

### 6. Rate Limiting

**Recommendation:**
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 phút
  max: 5,  // Tối đa 5 failed attempts
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true  // Chỉ count failed requests
});

// Apply vào auth routes
router.post('/login', authLimiter, authController.login);
```

**Benefits:**
- Chống brute force attacks
- Chống token enumeration attacks
- Giảm tải cho server

### 7. HTTPS Only

**Production Requirement:**
```javascript
// Set secure flag cho cookies
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

**Why:**
- JWT token gửi qua HTTP có thể bị intercept (man-in-the-middle attack)
- Luôn dùng HTTPS trong production

---

## Common Issues & Solutions

### Issue 1: "No token provided" khi đã gửi token

**Nguyên nhân:**
- Authorization header không đúng format
- Thiếu space giữa "Bearer" và token
- Header name sai (ví dụ: "Authentication" thay vì "Authorization")

**Solution:**
```javascript
// ✅ CORRECT
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ❌ WRONG: Thiếu "Bearer "
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ❌ WRONG: Thiếu space
Authorization: BearereyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ❌ WRONG: Header name sai
Authentication: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Issue 2: "Invalid or expired token" ngay sau khi login

**Nguyên nhân:**
- JWT_SECRET khác nhau giữa lúc tạo token và lúc verify
- Server restart và JWT_SECRET thay đổi
- Token bị chỉnh sửa trong quá trình truyền

**Solution:**
```javascript
// Kiểm tra JWT_SECRET
console.log('JWT_SECRET used:', process.env.JWT_SECRET);

// Đảm bảo dùng cùng secret khi sign và verify
// Trong auth.controller.js (sign):
const token = jwt.sign(payload, process.env.JWT_SECRET);

// Trong verifyTokens.js (verify):
jwt.verify(token, process.env.JWT_SECRET, callback);
```

### Issue 3: Token expire quá nhanh

**Nguyên nhân:**
- `expiresIn` setting quá ngắn
- Server và client có timezone khác nhau (ít gặp vì JWT dùng Unix timestamp)

**Solution:**
```javascript
// Tăng expiration time
const token = jwt.sign(
  payload,
  process.env.JWT_SECRET,
  { expiresIn: '24h' }  // Thay vì '1h'
);

// Hoặc implement refresh token mechanism
```

### Issue 4: Token vẫn hoạt động sau khi logout

**Nguyên nhân:**
- Token không được add vào blacklist
- Blacklist bị clear (server restart với in-memory Set)
- Logic check blacklist bị bypass

**Solution:**
```javascript
// Đảm bảo logout controller add token vào blacklist
const token = authHeader.split(' ')[1];
tokenBlacklist.add(token);

// Dùng Redis thay vì in-memory Set (xem Security Best Practices #4)
```

### Issue 5: "Access denied: user role not found"

**Nguyên nhân:**
- Token không chứa field `role` trong payload
- Token được tạo với version cũ của code (trước khi thêm role)
- `authorizeRole` được dùng mà không có `verifyToken` trước đó

**Solution:**
```javascript
// Đảm bảo role được include khi tạo token
const token = jwt.sign(
  { 
    account_id: user.account_id,
    email: user.email,
    role: user.role  // ⚠️ Phải có field này
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

// Đảm bảo verifyToken luôn chạy trước authorizeRole
router.delete('/admin', verifyToken, authorizeRole('admin'), controller);
//                      ^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^
//                      Phải theo thứ tự này
```

### Issue 6: CORS errors khi gửi Authorization header

**Nguyên nhân:**
- Frontend và backend khác domain
- CORS không allow Authorization header

**Solution:**
```javascript
// Trong cors.config.js
const corsOptions = {
  origin: 'http://localhost:3000',  // Frontend URL
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

---

## Testing Examples

### Test 1: Valid Token

**Request:**
```http
GET /api/profile HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoxLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwODY0MDB9.xyz123
```

**Expected Result:**
- Status: 200 OK
- `req.user` được set với `{ account_id: 1, email: 'admin@example.com', role: 'admin' }`
- Controller chạy bình thường

### Test 2: No Token

**Request:**
```http
GET /api/profile HTTP/1.1
Host: localhost:3000
```

**Expected Result:**
```json
{
  "message": "No token provided"
}
```
- Status: 401 Unauthorized

### Test 3: Blacklisted Token (After Logout)

**Request:**
```http
GET /api/profile HTTP/1.1
Host: localhost:3000
Authorization: Bearer [token_that_was_already_logged_out]
```

**Expected Result:**
```json
{
  "message": "Token has been logged out"
}
```
- Status: 401 Unauthorized

### Test 4: Expired Token

**Request:**
```http
GET /api/profile HTTP/1.1
Host: localhost:3000
Authorization: Bearer [expired_token]
```

**Expected Result:**
```json
{
  "message": "Invalid or expired token"
}
```
- Status: 403 Forbidden

### Test 5: Wrong Role

**Request:**
```http
DELETE /api/users/123 HTTP/1.1
Host: localhost:3000
Authorization: Bearer [token_with_role_customer]
```

**Expected Result:**
```json
{
  "statusCode": 403,
  "message": "Access denied: your role 'customer' is not allowed. Allowed role(s): admin"
}
```
- Status: 403 Forbidden

### Test 6: Correct Role

**Request:**
```http
DELETE /api/users/123 HTTP/1.1
Host: localhost:3000
Authorization: Bearer [token_with_role_admin]
```

**Expected Result:**
- Status: 200 OK (hoặc 204 No Content)
- Controller chạy và xóa user thành công

---

## Flow Diagrams

### Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────────────────────────┐
│     auth.controller.login()         │
│  - Verify credentials               │
│  - Generate JWT token               │
│  - Return token to client           │
└──────────────┬──────────────────────┘
               │
               │ 2. Response: { token: "eyJ..." }
               ▼
┌─────────────────────────────────────┐
│   Client stores token               │
│   (localStorage/cookie)             │
└──────────────┬──────────────────────┘
               │
               │ 3. Subsequent requests include token
               │    Authorization: Bearer eyJ...
               ▼
┌─────────────────────────────────────┐
│   verifyToken middleware            │
│  1. Extract token from header       │
│  2. Check if blacklisted            │
│  3. Verify signature & expiration   │
│  4. Set req.user                    │
└──────────────┬──────────────────────┘
               │
               │ 4. Token valid
               ▼
┌─────────────────────────────────────┐
│   authorizeRole middleware          │
│  1. Check req.user.role             │
│  2. Compare with allowedRoles       │
└──────────────┬──────────────────────┘
               │
               │ 5. Role authorized
               ▼
┌─────────────────────────────────────┐
│   Controller executes               │
│   - Has access to req.user          │
│   - Process business logic          │
│   - Return response                 │
└─────────────────────────────────────┘
```

### Logout Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /api/auth/logout
       │    Authorization: Bearer [token]
       ▼
┌─────────────────────────────────────┐
│     verifyToken middleware          │
│  - Extract token                    │
│  - Verify (không check blacklist)   │
└──────────────┬──────────────────────┘
               │
               │ 2. Token valid, req.user set
               ▼
┌─────────────────────────────────────┐
│   auth.controller.logout()          │
│  - Get token from Authorization     │
│  - Add token to blacklist           │
│  - Return success message           │
└──────────────┬──────────────────────┘
               │
               │ 3. Response: { message: "Logged out" }
               ▼
┌─────────────────────────────────────┐
│   Client removes token              │
│   (clear localStorage/cookie)       │
└─────────────────────────────────────┘
```

### Error Handling Flow

```
Request
   │
   ▼
┌────────────────────┐
│  verifyToken       │
└─────┬──────────────┘
      │
      ├─ No token? ────────────────────┐
      │                                 │
      ├─ Blacklisted? ─────────────────┤
      │                                 │
      ├─ Invalid signature? ───────────┤
      │                                 │
      ├─ Expired? ─────────────────────┤
      │                                 │
      └─ Valid ──┐                      │
                 ▼                      │
         ┌──────────────┐               │
         │authorizeRole │               │
         └─────┬────────┘               │
               │                        │
               ├─ No req.user? ─────────┤
               │                        │
               ├─ Wrong role? ──────────┤
               │                        │
               └─ Authorized ──┐        │
                                ▼       │
                          Controller    │
                          executes      │
                                        ▼
                                   Error Response
                                   - 401/403
                                   - Error message
```

---

## Summary

### Middleware `verifyToken`:
1. **Extract token** từ Authorization header
2. **Check blacklist** - token có bị revoke không
3. **Verify JWT** - signature và expiration
4. **Set req.user** - lưu account_id, email, role
5. **Call next()** - chuyển sang middleware tiếp theo

### Middleware `authorizeRole`:
1. **Higher-order function** - nhận allowedRoles và return middleware
2. **Check req.user** - đảm bảo đã authenticated
3. **Check role** - so sánh req.user.role với allowedRoles
4. **Throw error** - nếu không được phép, throw ApiError 403
5. **Call next()** - nếu authorized, chuyển sang controller

### Security Features:
- ✅ JWT-based authentication (stateless)
- ✅ Token blacklist (revocation mechanism)
- ✅ Role-based access control (RBAC)
- ✅ Centralized error handling
- ✅ Detailed error messages cho debugging
- ⚠️ Token blacklist cần upgrade lên Redis cho production

### Usage Pattern:
```javascript
// Authentication only
router.get('/endpoint', verifyToken, controller);

// Authentication + Authorization
router.get('/admin-endpoint', verifyToken, authorizeRole('admin'), controller);

// Multiple roles allowed
router.put('/endpoint', verifyToken, authorizeRole('admin', 'staff'), controller);
```

---

## Related Files

1. **`src/controllers/auth.controller.js`**: Tạo JWT token khi login
2. **`src/utils/tokenBlacklist.js`**: Quản lý danh sách token đã logout
3. **`src/utils/ApiError.js`**: Custom error class cho consistent error handling
4. **`.env`**: Chứa JWT_SECRET và config khác
5. **`src/routes/*.route.js`**: Sử dụng các middleware này trong route definitions

---

**File này giải thích toàn bộ logic và best practices của `verifyTokens.js` middleware system.**
