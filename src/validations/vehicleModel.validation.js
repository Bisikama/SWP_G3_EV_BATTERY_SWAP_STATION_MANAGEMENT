// src/validators/vehicleModelValidator.js
const { body, param } = require('express-validator');

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer')
];

const create = [
  body('battery_type_id')
    .exists({ values: 'null' }).withMessage('battery_type_id is required')
    .isInt().withMessage('battery_type_id must be an integer'),

  body('name')
    .notEmpty().withMessage('name is required') 
    .isString().withMessage('name must be a string')
    .isLength({ max: 100 }).withMessage('name max length is 100'),

  body('brand')
    .notEmpty().withMessage('brand is required')
    .isString().withMessage('brand must be a string')
    .isLength({ max: 50 }).withMessage('brand max length is 50'),

  body('avg_energy_usage')
    .exists({ values: 'null' }).withMessage('avg_energy_usage is required')
    .isFloat({ gt: 0 }).withMessage('avg_energy_usage must be a positive decimal number')
];

const update = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer'),

  body('battery_type_id')
    .optional()
    .isInt().withMessage('battery_type_id must be an integer'),

  body('name')
    .optional()
    .isString().withMessage('name must be a string')
    .isLength({ max: 100 }).withMessage('name max length is 100'),

  body('brand')
    .optional()
    .isString().withMessage('brand must be a string')
    .isLength({ max: 50 }).withMessage('brand max length is 50'),

  body('avg_energy_usage')
    .optional()
    .isFloat({ gt: 0 }).withMessage('avg_energy_usage must be a positive decimal number')
];

const remove = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer')
];

module.exports = { findById, create, update, remove };

