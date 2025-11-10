// src/middlewares/validateVin.js
'use strict';

/**
 * VIN VALIDATION MIDDLEWARE
 * File: src/middlewares/validateVin.js
 * 
 * Validate Vehicle Identification Number (VIN) theo format custom cho xe điện.
 * 
 * VIN Structure (17 characters):
 * - WMI (World Manufacturer Identifier): 3 ký tự đầu - BẮT BUỘC "RL9"
 * - VDS (Vehicle Descriptor Section): 3 ký tự tiếp - Mã dòng xe (LUD, IMP, KLA, v.v.)
 * - VIS (Vehicle Identifier Section): 11 ký tự cuối - Năm + Nhà máy + Serial
 * 
 * Format: RL9[VDS][VIS]
 * Example: RL9LUD24HN00001 (Ludo, năm 2024, nhà máy HN, serial 00001)
 * 
 * Supported Vehicle Models (VDS):
 * - LUD: Ludo
 * - IMP: Impes
 * - KLA: Klara S
 * - TES: Theon S
 * - VEN: Vento
 * - THE: Theon
 * - VES: Vento S
 * - FEL: Feliz S
 * - EVO: Evo200
 */
function validateVin(req, res, next) {
  // Step 1: Lấy VIN từ request body HOẶC params (GET /vin/:vin)
  const vin = req.body?.vin || req.params?.vin;

  // Step 2: Kiểm tra VIN có tồn tại không
  if (!vin) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: 'VIN_REQUIRED',
        message: 'VIN is required',
        field: 'vin',
        hint: 'Please provide a Vehicle Identification Number in the request body or URL parameter'
      }
    });
  }

  // Step 3: Chuẩn hóa VIN (uppercase, trim)
  const normalizedVin = vin.toString().toUpperCase().trim();

  // Step 4: Kiểm tra độ dài (phải đúng 17 ký tự)
  if (normalizedVin.length !== 17) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: 'VIN_INVALID_LENGTH',
        message: 'VIN must be exactly 17 characters',
        field: 'vin',
        received: {
          vin: normalizedVin,
          length: normalizedVin.length
        },
        expected: {
          length: 17,
          format: 'RL9[VDS][VIS]',
          example: 'RL9LUD24HN00001'
        }
      }
    });
  }

  // Step 5: Extract components
  const wmi = normalizedVin.substring(0, 3);   // WMI: 3 ký tự đầu (RL9)
  const vds = normalizedVin.substring(3, 6);   // VDS: 3 ký tự tiếp (LUD, IMP, ...)
  const vis = normalizedVin.substring(6, 17);  // VIS: 11 ký tự cuối (năm + plant + serial)

  // Step 6: Validate WMI (phải là "RL9")
  if (wmi !== 'RL9') {
    return res.status(400).json({ 
      success: false,
      error: {
        code: 'VIN_INVALID_WMI',
        message: 'Invalid World Manufacturer Identifier (WMI)',
        field: 'vin',
        received: {
          vin: normalizedVin,
          wmi: wmi,
          position: 'Characters 1-3'
        },
        expected: {
          wmi: 'RL9',
          description: 'VIN must start with RL9'
        }
      }
    });
  }

  // Step 7: Validate VDS (phải thuộc danh sách dòng xe hợp lệ)
  const validVdsCodes = ['LUD', 'IMP', 'KLA', 'TES', 'VEN', 'THE', 'VES', 'FEL', 'EVO'];
  if (!validVdsCodes.includes(vds)) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: 'VIN_INVALID_VDS',
        message: 'Invalid Vehicle Descriptor Section (VDS)',
        field: 'vin',
        received: {
          vin: normalizedVin,
          vds: vds,
          position: 'Characters 4-6'
        },
        expected: {
          validCodes: validVdsCodes,
          description: 'VDS must be one of the supported vehicle model codes'
        }
      }
    });
  }

  // Step 8: Validate VIS (11 ký tự alphanumeric)
  const visRegex = /^[A-Z0-9]{11}$/;
  if (!visRegex.test(vis)) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: 'VIN_INVALID_VIS',
        message: 'Invalid Vehicle Identifier Section (VIS)',
        field: 'vin',
        received: {
          vin: normalizedVin,
          vis: vis,
          position: 'Characters 7-17'
        },
        expected: {
          format: '11 alphanumeric characters (A-Z, 0-9)',
          example: '24HN00001',
          description: 'VIS must contain only uppercase letters and numbers'
        }
      }
    });
  }

  // Step 9: Gắn VIN đã chuẩn hóa vào request (cả body và params)
  if (req.body) {
    req.body.vin = normalizedVin;
  }
  if (req.params && req.params.vin !== undefined) {
    req.params.vin = normalizedVin;
  }
  
  // Step 10: Gắn parsed components vào request (optional, for later use)
  req.vin_components = {
    wmi: wmi,                        // "RL9"
    vds: vds,                        // "LUD", "IMP", "KLA", etc.
    vis: vis,                        // "24HN00001", "2024A0123", etc.
    model: getModelName(vds)         // "Ludo", "Impes", "Klara S", etc.
  };

  // Step 11: Chuyển sang middleware/controller tiếp theo
  next();
}

/**
 * Helper function: Map VDS code to vehicle model name
 * 
 * Chuyển đổi mã VDS (3 ký tự) thành tên dòng xe đầy đủ.
 * 
 * @param {string} vdsCode - VDS code (LUD, IMP, KLA, etc.)
 * @returns {string} Model name (Ludo, Impes, Klara S, etc.)
 * 
 * @example
 * getModelName('LUD') → 'Ludo'
 * getModelName('IMP') → 'Impes'
 * getModelName('KLA') → 'Klara S'
 */
function getModelName(vdsCode) {
  const modelMap = {
    'LUD': 'Ludo',
    'IMP': 'Impes',
    'KLA': 'Klara S',
    'TES': 'Theon S',
    'VEN': 'Vento',
    'THE': 'Theon',
    'VES': 'Vento S',
    'FEL': 'Feliz S',
    'EVO': 'Evo200'
  };
  return modelMap[vdsCode] || 'Unknown';
}

module.exports = validateVin;
