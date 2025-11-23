// Import Account model để query database
// Account chứa: email, password_hash, role, status, etc.
const { Account } = require('../models');

// Import bcrypt để so sánh password với hash
// bcrypt.compare() là one-way comparison (không thể reverse hash)
const bcrypt = require('bcrypt');

// Import jsonwebtoken để tạo JWT token
// JWT = Header.Payload.Signature (encoded với base64)
const jwt = require('jsonwebtoken');

// Import token blacklist để quản lý danh sách token đã logout
// Blacklist prevents reuse of logged-out tokens
const tokenBlacklist = require('../utils/tokenBlacklist');

/**
 * Service xử lý authentication - verify credentials và generate JWT token
 * 
 * Flow chính:
 * 1. Validate input (email và password required)
 * 2. Tìm account trong database theo email
 * 3. Kiểm tra account status = 'active'
 * 4. So sánh password với password_hash bằng bcrypt.compare()
 * 5. Generate JWT token với payload { account_id, email, role }
 * 6. Return token (valid 8 hours)
 * 
 * @param {Object} credentials - { email, password }
 * @returns {String} JWT token string
 * @throws {Error} với status code 400/401/403/500
 */
async function authenticate({ email, password }) {
  // ========================================
  // STEP 1: VALIDATE INPUT
  // ========================================
  // Kiểm tra email và password được cung cấp chưa
  // Throw error 400 Bad Request nếu thiếu
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400; // Bad Request
    throw err;
  }

  // ========================================
  // STEP 2: FIND ACCOUNT IN DATABASE
  // ========================================
  // Query database tìm account với email này
  // Sequelize findOne() returns:
  // - Account object nếu tìm thấy
  // - null nếu không tìm thấy
  // where: { email } tự động escape SQL injection
  const account = await Account.findOne({ where: { email } });
  
  // Nếu không tìm thấy account → credentials sai
  // Message chung chung "Email or password is incorrect" để:
  // - Không tiết lộ email có tồn tại trong hệ thống hay không
  // - Security best practice: generic error message
  if (!account) {
    const err = new Error('Email or password is incorrect');
    err.status = 401; // Unauthorized
    throw err;
  }

  // ========================================
  // STEP 3: CHECK ACCOUNT STATUS
  // ========================================
  // Account phải có status = 'active' mới được login
  // Possible statuses: 'active', 'inactive'
  // Ngăn chặn login từ:
  // - Account bị khóa/suspended
  // - Account chưa kích hoạt email
  // - Account bị ban
  if (account.status !== 'active') {
    const err = new Error('Account is not active');
    err.status = 403; // Forbidden (credentials đúng nhưng không có quyền access)
    throw err;
  }

  // ========================================
  // STEP 4: VERIFY PASSWORD WITH BCRYPT
  // ========================================
  // So sánh plain password với hashed password trong database
  // bcrypt.compare() internal flow:
  // 1. Extract salt từ account.password_hash
  //    (salt embedded trong hash string: "$2b$10$salthere...")
  // 2. Hash input password với salt đó và SALT_ROUNDS từ hash
  // 3. So sánh hash mới với hash trong database
  // 4. Return true nếu match, false nếu không
  //
  // Ví dụ:
  //   Input password: "MyPass123"
  //   Stored hash: "$2b$10$N9qo8uLOickgx2ZMRZoMyO.ybzGzE7YF8pJxJFxEODiVhF6X5Au"
  //   → Extract salt: "$2b$10$N9qo8uLOickgx2ZMRZoMyO"
  //   → Hash "MyPass123" with that salt
  //   → Compare: new hash === stored hash → true/false
  let match;
  try {
    // bcrypt.compare(plainPassword, hashedPassword)
    // Returns: Promise<boolean>
    match = await bcrypt.compare(password, account.password_hash);
  } catch (err) {
    // Nếu bcrypt.compare() throw error (rare case):
    // - Invalid hash format trong database
    // - Bcrypt library error
    // Log chi tiết error để debug, throw generic error cho client
    console.error('Error comparing password', err);
    const e = new Error('Failed to verify password');
    e.status = 500; // Internal Server Error
    throw e;
  }

  // Nếu password không match → credentials sai
  // Message giống với "account not found" case
  // Security: Không tiết lộ email đúng nhưng password sai
  if (!match) {
    const err = new Error('Email or password is incorrect');
    err.status = 401; // Unauthorized
    throw err;
  }

  // ========================================
  // STEP 5: GET JWT SECRET FROM ENVIRONMENT
  // ========================================
  // JWT_SECRET được lưu trong .env file (KHÔNG commit lên Git)
  // Secret này dùng để:
  // - Sign JWT token (tạo signature)
  // - Verify JWT token (check signature validity)
  // 
  // Best practices:
  // - Secret phải dài ít nhất 32 characters
  // - Random string (không dùng password/email)
  // - Khác nhau giữa development và production
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Critical error: Server không thể hoạt động mà không có JWT_SECRET
    const err = new Error('Server configuration error');
    err.status = 500; // Internal Server Error
    throw err;
  }

  // ========================================
  // STEP 6: CREATE JWT TOKEN PAYLOAD
  // ========================================
  // Payload chứa thông tin user (KHÔNG chứa sensitive data)
  // Payload sẽ được:
  // 1. Serialize thành JSON
  // 2. Encode base64 (KHÔNG phải encrypt!)
  // 3. Embed vào JWT token
  //
  // ⚠️ Lưu ý:
  // - Client có thể decode payload (base64 decode)
  // - KHÔNG lưu password, credit card, hay sensitive data
  // - Chỉ lưu data cần thiết: ID, email, role
  // - Payload không thể modify vì signature sẽ invalid
  const payload = {
    account_id: account.account_id, // User's unique ID (for database queries)
    email: account.email,           // User's email (for display purposes)
    role: account.role              // User's role: 'admin', 'staff', 'driver' (for authorization)
  };
  
  // ========================================
  // STEP 7: SIGN JWT TOKEN
  // ========================================
  try {
    // jwt.sign() creates token with 3 parts separated by dots:
    // Format: "xxxxx.yyyyy.zzzzz"
    //
    // Part 1 (xxxxx): Header (base64 encoded)
    //   { "alg": "HS256", "typ": "JWT" }
    //   - alg: Algorithm sử dụng (HMAC SHA-256)
    //   - typ: Token type (JWT)
    //
    // Part 2 (yyyyy): Payload (base64 encoded)
    //   { 
    //     "account_id": 1, 
    //     "email": "user@example.com", 
    //     "role": "driver",
    //     "iat": 1700000000,  // Issued At (auto-added)
    //     "exp": 1700028800   // Expiration (auto-added by expiresIn)
    //   }
    //
    // Part 3 (zzzzz): Signature
    //   HMACSHA256(
    //     base64UrlEncode(header) + "." + base64UrlEncode(payload),
    //     secret
    //   )
    //   → Signature đảm bảo token không bị modify
    //
    // Options:
    // - expiresIn: '8h' → token hết hạn sau 8 giờ
    //   (tự động thêm field 'exp' vào payload)
    //   Sau 8h, token invalid ngay cả khi signature đúng
    //
    // Token lifetime best practices:
    // - Access token: 15 phút - 8 giờ (ngắn = an toàn hơn)
    // - Refresh token: 7-30 ngày (để renew access token)
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });
    
    // Return token string để controller trả về cho client
    // Client sẽ lưu token và gửi kèm trong subsequent requests:
    // Authorization: Bearer <token>
    //
    // Client có thể lưu token trong:
    // - localStorage: Dễ implement nhưng vulnerable to XSS attacks
    // - httpOnly cookie: An toàn hơn (không access được từ JavaScript)
    return token;
  } catch (err) {
    // Nếu jwt.sign() fail (rare cases):
    // - Invalid secret format
    // - Invalid expiresIn format
    // - Payload quá lớn
    // Log chi tiết error để debug, throw generic error cho client
    console.error('JWT sign error', err);
    const e = new Error('Authentication error');
    e.status = 500; // Internal Server Error
    throw e;
  }
}

/**
 * Service xử lý logout - add token vào blacklist
 * 
 * Cơ chế Blacklist:
 * - JWT token stateless: Server không lưu token trong database
 * - Token còn valid về signature và expiration sau khi logout
 * - Solution: Maintain blacklist (danh sách token đã logout)
 * - verifyToken middleware check blacklist trước khi accept token
 * 
 * Implementation:
 * - Development: In-memory Set (mất data khi restart server)
 * - Production: Redis/Memcached (persistent, distributed, auto-expire)
 * 
 * Flow:
 * 1. Controller gọi logout() với token từ Authorization header
 * 2. Token được add vào blacklist
 * 3. Subsequent requests với token này bị reject bởi verifyToken middleware
 * 
 * Considerations:
 * - Blacklist size tăng theo thời gian
 * - Cần cleanup expired tokens (TTL = token expiration time)
 * - Redis SETEX tự động expire after token's remaining lifetime
 * 
 * @param {String} token - JWT token string cần blacklist
 */
function logout(token) {
  // Add token vào blacklist
  // tokenBlacklist.add() implementation (giả sử):
  // - Development: Set.add(token)
  // - Production: redis.setex(token, ttl, '1')
  //   ttl = token expiration time - current time
  //   Tự động xóa token khỏi Redis sau khi expire
  tokenBlacklist.add(token);
  
  // Note: Function này synchronous và không throw error
  // Trong production nên:
  // 1. Return Promise để handle Redis errors
  // 2. Log errors nếu blacklist operation fail
  // 3. Consider graceful degradation nếu Redis down
}

// Export cả 2 functions để sử dụng trong controllers
// Usage:
// const authService = require('../services/auth.service');
// const token = await authService.authenticate({ email, password });
// authService.logout(token);
module.exports = { authenticate, logout };