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

  body('battery_cap')
    .notEmpty().withMessage('battery_cap is required')
		.isInt({ min: 0 }).withMessage('battery_cap must be a non-negative integer'),

  body('usage_cap')
    .notEmpty().withMessage('usage_cap is required')
		.isFloat({ min: 0 }).withMessage('usage_cap must be a non-negative number'),

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

  body('battery_cap')
    .optional()
		.isInt({ min: 0 }).withMessage('battery_cap must be a non-negative integer'),

  body('usage_cap')
    .optional()
		.isFloat({ min: 0 }).withMessage('usage_cap must be a non-negative number'),

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