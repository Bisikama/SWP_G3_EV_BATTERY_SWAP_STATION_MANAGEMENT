const { body, param } = require('express-validator');

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
];

const create = [
  body('plan_name')
    .optional()
    .isString().withMessage('plan_name must be a string')
    .isLength({ max: 100 }).withMessage('plan_name max length is 100'),
  
  body('plan_fee')
    .notEmpty().withMessage('plan_fee is required')
		.isFloat({ gt: 0 }).withMessage('plan_fee must be a positive number'),

  body('swap_fee')
    .notEmpty().withMessage('swap_fee is required')
    .isFloat({ min: 0 }).withMessage('swap_fee must be non-negative'),

  body('penalty_fee')
    .notEmpty().withMessage('penalty_fee is required')
    .isFloat({ min: 0 }).withMessage('penalty_fee must be non-negative'),

  body('soh_cap')
    .notEmpty().withMessage('soh_cap is required')
    .isFloat({ min: 0 }).withMessage('soh_cap must be non-negative'),

  body('duration_days')
    .notEmpty().withMessage('duration_days is required')
    .isInt({ min: 0 }).withMessage('duration_days must be a non-negative integer'),

  body('description')
    .optional()
		.isString().withMessage('description must be a string'),

  body('is_active')
    .optional({ nullable: true })
		.isBoolean().withMessage('is_active must be boolean')
];

const update = [
  param('id')
    .notEmpty().withMessage('id is required'),

  body('plan_name')
    .optional()
    .isString().withMessage('plan_name must be a string')
    .isLength({ max: 100 }).withMessage('plan_name max length is 100'),
  
  body('plan_fee')
    .optional()
		.isFloat({ gt: 0 }).withMessage('plan_fee must be a positive number'),

  body('swap_fee')
    .optional()
    .isFloat({ min: 0 }).withMessage('swap_fee must be non-negative'),

  body('penalty_fee')
    .optional()
  .isFloat({ min: 0 }).withMessage('penalty_fee must be non-negative'),

  body('soh_cap')
    .optional()
  .isFloat({ min: 0 }).withMessage('soh_cap must be non-negative'),

  body('duration_days')
    .optional()
  .isInt({ min: 0 }).withMessage('duration_days must be a non-negative integer'),

  body('description')
    .optional()
		.isString().withMessage('description must be a string')
];

const updateStatus = [
  param('id')
    .notEmpty().withMessage('id is required')
];

const remove = [
  param('id')
    .notEmpty().withMessage('id is required')
];

module.exports = { findById, create, update, updateStatus, remove };