/**
 * Vehicle Validation
 * 
 * Request validation schemas for vehicle operations.
 * Uses express-validator to validate and sanitize input data.
 * 
 * Validation rules:
 *   - register: Validate new vehicle registration data
 *   - update: Validate vehicle update data
 *   - findById: Validate vehicle ID parameter
 *   - findByVin: Validate VIN parameter
 *   - findByUserId: Validate user ID parameter
 */

const { body, param } = require('express-validator');

/**
 * Register Vehicle Validation
 * POST /api/vehicles
 * 
 * Validates:
 *   - vin: Will be validated by validateVin middleware (custom format)
 *   - model_id: Positive integer
 *   - license_plate: Vietnam motorcycle format
 * 
 * Note: VIN validation is handled by validateVin middleware to support custom format:
 *       RL9[VDS][VIS] where VDS is vehicle model code (LUD, IMP, etc.)
 */
const register = [
  // VIN validation removed - handled by validateVin middleware
  // This allows custom validation logic with better error messages

  body('model_id')
    .notEmpty().withMessage('Vehicle model ID is required')
    .isInt({ gt: 0 }).withMessage('Model ID must be a positive integer'),

  body('license_plate')
    .notEmpty().withMessage('License plate is required')
    .isString().withMessage('License plate must be a string')
    .trim()
    .matches(/^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/i)
    .withMessage('License plate format invalid. Vietnam motorcycle format: 30A-12345, 51F-98765, 59X1-12345')
    .isLength({ max: 20 })
];

/**
 * Update Vehicle Validation
 * PUT /api/vehicles/:id
 * 
 * Validates:
 *   - id: Valid UUID
 *   - license_plate: Optional, Vietnam motorcycle format
 *   - model_id: Optional, positive integer
 *   - At least one field must be provided
 */
const update = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isUUID().withMessage('Vehicle ID must be a valid UUID'),

  body('license_plate')
    .optional()
    .isString().withMessage('License plate must be a string')
    .trim()
    .matches(/^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/i)
    .withMessage('License plate format invalid. Vietnam motorcycle format: 30A-12345, 51F-98765, 59X1-12345')
    .isLength({ max: 20 }),

  body('model_id')
    .optional()
    .isInt({ gt: 0 }).withMessage('Model ID must be a positive integer'),

  body().custom((value, { req }) => {
    if (!req.body.license_plate && !req.body.model_id) {
      throw new Error('At least one field (license_plate or model_id) must be provided');
    }
    return true;
  })
];

/**
 * Find By ID Validation
 * DELETE /api/vehicles/:id
 * GET /api/vehicles/:id
 * 
 * Validates:
 *   - id: Valid UUID
 */
const findById = [
  param('id')
    .notEmpty().withMessage('Vehicle ID is required')
    .isUUID().withMessage('Vehicle ID must be a valid UUID')
];

/**
 * Find By VIN Validation
 * GET /api/vehicles/vin/:vin
 * 
 * Validates:
 *   - vin: Basic checks only, detailed validation by validateVin middleware
 */
const findByVin = [
  param('vin')
    .notEmpty().withMessage('VIN is required')
    .isString().withMessage('VIN must be a string')
  // Detailed VIN format validation is handled by validateVin middleware
];

/**
 * Find By User ID Validation
 * GET /api/vehicles/user/:userId
 * 
 * Validates:
 *   - userId: Valid UUID
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
