// src/middlewares/validateVin.js
'use strict';

/**
 * ========================================
 * VIN VALIDATION MIDDLEWARE
 * ========================================
 * Mục đích: Validate Vehicle Identification Number (VIN) theo chuẩn ISO 3779
 * 
 * VIN là gì?
 * - VIN = Vehicle Identification Number (Số khung xe)
 * - Mỗi xe có 1 VIN duy nhất (như CMND/CCCD của xe)
 * - Độ dài: 17 ký tự (bắt buộc)
 * - Không chứa: I, O, Q (vì dễ nhầm với 1, 0)
 * 
 * Ví dụ VIN hợp lệ: 1HGBH41JXMN109186
 * ========================================
 */
function validateVin(req, res, next) {
  // Bước 1: Lấy VIN từ request body
  const { vin } = req.body || {};

  // Bước 2: Kiểm tra VIN có tồn tại không
  if (!vin) {
    return res.status(400).json({ 
      message: 'VIN is required',
      hint: 'Please provide a Vehicle Identification Number'
    });
  }

  // Bước 3: Chuẩn hóa VIN
  // - Chuyển sang UPPERCASE (VIN luôn viết hoa)
  // - Trim() để xóa khoảng trắng thừa đầu/cuối
  const normalizedVin = vin.toString().toUpperCase().trim();

  // Bước 4: Kiểm tra độ dài (phải đúng 17 ký tự)
  if (normalizedVin.length !== 17) {
    return res.status(400).json({ 
      message: 'VIN must be exactly 17 characters',
      received: normalizedVin.length,
      hint: 'A valid VIN has 17 characters (e.g., 1HGBH41JXMN109186)'
    });
  }

  // Bước 5: Kiểm tra format VIN
  // Regex: /^[A-HJ-NPR-Z0-9]{17}$/
  // - A-H: Chữ cái A đến H (bỏ I)
  // - J-N: Chữ cái J đến N (bỏ O)
  // - P-R: Chữ cái P đến R (bỏ Q)
  // - S-Z: Chữ cái S đến Z
  // - 0-9: Số từ 0 đến 9
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  if (!vinRegex.test(normalizedVin)) {
    return res.status(400).json({ 
      message: 'Invalid VIN format',
      detail: 'VIN must contain only A-Z (excluding I, O, Q) and 0-9',
      hint: 'Characters I, O, Q are not allowed in VIN to avoid confusion with 1 and 0'
    });
  }

  // Bước 6: Validate check digit (ký tự thứ 9 của VIN)
  // Check digit dùng để phát hiện lỗi gõ nhầm VIN
  if (!isValidVinCheckDigit(normalizedVin)) {
    return res.status(400).json({ 
      message: 'Invalid VIN check digit',
      detail: 'The 9th character of VIN does not match the calculated check digit',
      vin: normalizedVin,
      hint: 'Please verify the VIN number is correct'
    });
  }

  // Bước 7: Gắn VIN đã chuẩn hóa vào request để controller sử dụng
  req.body.vin = normalizedVin;
  
  // Bước 8: Chuyển sang middleware/controller tiếp theo
  next();
}

/**
 * ========================================
 * VALIDATE VIN CHECK DIGIT
 * ========================================
 * Mục đích: Kiểm tra ký tự thứ 9 của VIN (check digit) có đúng không
 * 
 * Check digit là gì?
 * - Là ký tự thứ 9 trong VIN
 * - Được tính toán dựa trên 16 ký tự còn lại
 * - Dùng để phát hiện lỗi gõ nhầm VIN
 * 
 * Cách tính:
 * 1. Chuyển mỗi ký tự thành số theo bảng transliteration
 * 2. Nhân với trọng số tương ứng
 * 3. Tính tổng và lấy modulo 11
 * 4. So sánh với ký tự thứ 9
 * 
 * Ví dụ: VIN = 1HGBH41JXMN109186
 *        Check digit = J (ký tự thứ 9)
 * ========================================
 */
function isValidVinCheckDigit(vin) {
  // Bảng chuyển đổi ký tự → số (theo chuẩn ISO 3779)
  // Ví dụ: A=1, B=2, C=3, ..., 0=0, 1=1, 2=2, ...
  const transliteration = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9
  };

  // Trọng số cho từng vị trí (theo chuẩn ISO 3779)
  // Vị trí 1→8: trọng số 8→1
  // Vị trí 9: check digit (trọng số = 0, không tính)
  // Vị trí 10→17: trọng số 9→2
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0; // Tổng tích số
  
  // Duyệt qua từng ký tự trong VIN
  for (let i = 0; i < 17; i++) {
    const char = vin[i]; // Lấy ký tự tại vị trí i
    const value = transliteration[char]; // Chuyển ký tự → số
    
    // Nếu ký tự không hợp lệ (không có trong bảng)
    if (value === undefined) {
      return false;
    }
    
    // Nhân giá trị với trọng số và cộng vào tổng
    sum += value * weights[i];
  }

  // Tính check digit: sum % 11
  const checkDigit = sum % 11;
  
  // Nếu check digit = 10 → ký tự 'X'
  // Nếu check digit = 0-9 → ký tự số tương ứng
  const expectedChar = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  // So sánh ký tự thứ 9 của VIN với check digit tính được
  return vin[8] === expectedChar;
}

module.exports = validateVin;
