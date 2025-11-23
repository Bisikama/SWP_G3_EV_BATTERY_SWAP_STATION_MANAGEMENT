// Import thư viện xử lý JWT (JSON Web Token)
const jwt = require('jsonwebtoken');

// Import module quản lý danh sách token đã bị vô hiệu hóa (sau khi logout)
const tokenBlacklist = require('../utils/tokenBlacklist');

// Import class ApiError để tạo error responses có cấu trúc chuẩn
const ApiError = require('../utils/ApiError');

/**
 * Middleware xác thực JWT token từ Authorization header
 * 
 * Flow:
 * 1. Lấy token từ header "Authorization: Bearer <token>"
 * 2. Kiểm tra token có tồn tại không
 * 3. Kiểm tra token có bị blacklist (đã logout) không
 * 4. Verify token với JWT_SECRET (kiểm tra signature và expiration)
 * 5. Nếu hợp lệ, decode token và lưu thông tin user vào req.user
 * 6. Chuyển control sang middleware/controller tiếp theo
 * 
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next - Function chuyển sang middleware tiếp theo
 */
function verifyToken(req, res, next) {
  // Lấy giá trị Authorization header
  // Format chuẩn: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = req.headers['authorization'];
  
  // Tách chuỗi để lấy token (bỏ chữ "Bearer")
  // authHeader.split(' ') tạo array ["Bearer", "token_value"]
  // [1] lấy phần tử thứ 2 (token value)
  // && đảm bảo không gọi split() nếu authHeader là null/undefined
  const token = authHeader && authHeader.split(' ')[1];

  // Kiểm tra token có được gửi kèm không
  // Trả về 401 Unauthorized nếu không có token
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Kiểm tra token có trong blacklist không (token đã logout)
  // Trả về 401 nếu token đã bị revoke
  // Điều này ngăn chặn việc tái sử dụng token sau khi logout
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: "Token has been logged out" });
  }

  // Xác thực token với JWT library
  // jwt.verify() kiểm tra:
  // - Token structure (3 phần: header.payload.signature)
  // - Signature có hợp lệ không (dùng JWT_SECRET)
  // - Token có hết hạn chưa (check field 'exp' trong payload)
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // Nếu có lỗi (signature sai, token expired, format không đúng)
    // Trả về 403 Forbidden
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Token hợp lệ - lưu thông tin user vào req.user
    // decoded là object chứa payload đã được decode từ JWT
    // Ví dụ decoded: { account_id: 1, email: "admin@example.com", role: "admin", iat: 1700000000, exp: 1700086400 }
    // Các middleware/controller sau có thể truy cập req.user
    req.user = {
      account_id: decoded.account_id,
      email: decoded.email,
      role: decoded.role,
    };

    // Chuyển control sang middleware/controller tiếp theo trong chain
    next();
  });
}

/**
 * Middleware phân quyền dựa trên role của user
 * Đây là Higher-Order Function - nhận parameters và trả về middleware function
 * 
 * Cách sử dụng:
 * - authorizeRole('admin') - chỉ admin được phép
 * - authorizeRole('admin', 'staff') - admin hoặc staff được phép
 * 
 * Lưu ý: Middleware này PHẢI được dùng sau verifyToken
 * 
 * @param {...string} allowedRoles - Danh sách các roles được phép truy cập
 * @returns {Function} Middleware function với signature (req, res, next)
 */
function authorizeRole(...allowedRoles) {
  // Return middleware function thực sự
  // Pattern này cho phép pass parameters vào middleware
  return (req, res, next) => {
    // Kiểm tra req.user có tồn tại không (đảm bảo verifyToken đã chạy trước)
    // Kiểm tra req.user.role có tồn tại không (đảm bảo token có chứa role)
    if (!req.user || !req.user.role) {
      // Throw error để error handling middleware xử lý centralized
      throw new ApiError(403, 'Access denied: user role not found');
    }

    // Kiểm tra role của user có trong danh sách allowedRoles không
    // allowedRoles.includes() trả về true nếu tìm thấy
    if (!allowedRoles.includes(req.user.role)) {
      // Tạo error message động, hiển thị:
      // - Role hiện tại của user
      // - Danh sách roles được phép (join bằng dấu phẩy)
      // Ví dụ: "Access denied: your role 'customer' is not allowed. Allowed role(s): admin, staff"
      throw new ApiError(
        403,
        `Access denied: your role '${req.user.role}' is not allowed. Allowed role(s): ${allowedRoles.join(', ')}`
      );
    }

    // Role hợp lệ - cho phép tiếp tục sang controller
    next();
  };
}

// Export cả hai middleware để sử dụng trong routes
// Ví dụ: const { verifyToken, authorizeRole } = require('../middlewares/verifyTokens');
module.exports = { verifyToken, authorizeRole };
