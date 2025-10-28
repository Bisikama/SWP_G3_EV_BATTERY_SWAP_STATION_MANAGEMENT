// ========================================
// VEHICLE VALIDATION
// ========================================
// File: src/validations/vehicle.validation.js
// Mục đích: Validation schemas cho vehicle operations
// Sử dụng express-validator để validate input
// ========================================

const { body, param } = require('express-validator');

/**
 * Validation cho việc đăng ký xe mới
 * POST /api/vehicles
 */
const register = [
  body('vin')
    .notEmpty().withMessage('VIN is required')
    .isString().withMessage('VIN must be a string')
    .isLength({ min: 17, max: 17 }).withMessage('VIN must be exactly 17 characters')
    .matches(/^[A-HJ-NPR-Z0-9]{17}$/i).withMessage('VIN contains invalid characters'),

  body('model_id')
    .notEmpty().withMessage('Vehicle model ID is required')
    .isInt({ gt: 0 }).withMessage('Model ID must be a positive integer'),

  body('license_plate')
    .notEmpty().withMessage('License plate is required')
    .isString().withMessage('License plate must be a string')
    .isLength({ min: 1, max: 20 }).withMessage('License plate must be between 1 and 20 characters')
    .trim()
];

/**
 * Validation cho việc cập nhật xe
 * PUT /api/vehicles/:id
 */
const update = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isUUID().withMessage('Vehicle ID must be a valid UUID'),

  body('license_plate')
    .optional()
    .isString().withMessage('License plate must be a string')
    .isLength({ min: 1, max: 20 }).withMessage('License plate must be between 1 and 20 characters')
    .trim(),

  body('model_id')
    .optional()
    .isInt({ gt: 0 }).withMessage('Model ID must be a positive integer'),

  // Đảm bảo ít nhất 1 field được cung cấp
  body().custom((value, { req }) => {
    if (!req.body.license_plate && !req.body.model_id) {
      throw new Error('At least one field (license_plate or model_id) must be provided');
    }
    return true;
  })
];

/**
 * Validation cho tham số ID trong URL
 * DELETE /api/vehicles/:id
 * GET /api/vehicles/:id
 */
const findById = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isUUID().withMessage('Vehicle ID must be a valid UUID')
];

/**
 * Validation cho tham số VIN trong URL
 * GET /api/vehicles/vin/:vin
 */
const findByVin = [
  param('vin')
    .notEmpty().withMessage('VIN is required')
    .isString().withMessage('VIN must be a string')
    .isLength({ min: 17, max: 17 }).withMessage('VIN must be exactly 17 characters')
    .matches(/^[A-HJ-NPR-Z0-9]{17}$/i).withMessage('VIN contains invalid characters')
];

/**
 * Validation cho tham số User ID trong URL
 * GET /api/vehicles/user/:userId
 */
const findByUserId = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('User ID must be a valid UUID')
];

module.exports = {
  register,
  update,
  findById,
  findByVin,
  findByUserId
};
