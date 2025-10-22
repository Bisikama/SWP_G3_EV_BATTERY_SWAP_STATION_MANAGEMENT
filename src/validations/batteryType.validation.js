const { body, param } = require('express-validator');

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer')
];

const create = [
  body('battery_type_code')
    .notEmpty().withMessage('battery_type_code is required')
    .isString().withMessage('battery_type_code must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('battery_type_code must be 1->100 chars'),

  body('nominal_capacity')
    .exists({ values: 'null' }).withMessage('nominal_capacity is required')
    .isFloat({ gt: 0 })
    .withMessage('nominal_capacity must be a positive decimal number'),

  body('nominal_voltage')
    .exists({ values: 'null' }).withMessage('nominal_voltage is required')
    .isFloat({ gt: 0 })
    .withMessage('nominal_voltage must be a positive decimal number'),

  body('min_voltage')
    .exists({ values: 'null' }).withMessage('min_voltage is required')
    .isFloat({ gt: 0 })
    .withMessage('min_voltage must be a positive decimal number'),

  body('max_voltage')
    .exists({ values: 'null' }).withMessage('max_voltage is required')
    .isFloat({ gt: 0 })
    .withMessage('max_voltage must be a positive decimal number'),

  body('rated_charge_current')
    .exists({ values: 'null' }).withMessage('rated_charge_current is required')
    .isFloat({ gt: 0 })
    .withMessage('rated_charge_current must be a positive decimal number'),

  body('max_charge_current')
    .exists({ values: 'null' }).withMessage('max_charge_current is required')
    .isFloat({ gt: 0 })
    .withMessage('max_charge_current must be a positive decimal number'),

  body('cell_chemistry')
    .notEmpty().withMessage('cell_chemistry is required')
    .isString().withMessage('cell_chemistry must be a string')
    .isIn(['Li-ion', 'LFP'])
    .withMessage('cell_chemistry must be either Li-ion or LFP'),
];

const update = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer'),

  body('battery_type_code')
    .optional()
    .isString().withMessage('battery_type_code must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('battery_type_code must be 1->100 chars'),

  body('nominal_capacity')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('nominal_capacity must be a positive decimal number'),

  body('nominal_voltage')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('nominal_voltage must be a positive decimal number'),

  body('min_voltage')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('min_voltage must be a positive decimal number'),

  body('max_voltage')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('max_voltage must be a positive decimal number'),

  body('rated_charge_current')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('rated_charge_current must be a positive decimal number'),

  body('max_charge_current')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('max_charge_current must be a positive decimal number'),

  body('cell_chemistry')
    .optional()
    .isString().withMessage('cell_chemistry must be a string')
    .isIn(['Li-ion', 'LFP'])
    .withMessage('cell_chemistry must be either Li-ion or LFP'),
];

const remove = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer')
];

module.exports = { findById, create, update, remove };
