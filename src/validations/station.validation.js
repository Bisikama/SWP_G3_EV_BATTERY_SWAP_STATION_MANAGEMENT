const { body, param } = require('express-validator');

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer')
];

const create = [
  body('station_name')
    .notEmpty().withMessage('station_name is required')
    .isString().withMessage('station_name must be a string')
    .isLength({ max: 100 }).withMessage('station_name max length 100'),

  body('address')
    .optional()
    .isString().withMessage('address must be a string')
    .isLength({ max: 255 }).withMessage('address max length 255'),

  body('latitude')
    .exists({ checkNull: true }).withMessage('latitude is required')
    .isFloat().withMessage('latitude must be a decimal number'),

  body('longitude')
    .exists({ checkNull: true }).withMessage('longitude is required')
    .isFloat().withMessage('longitude must be a decimal number'),
    
  body('status')
    .notEmpty().withMessage('status is required')
    .isIn(['operational','maintenance','closed'])
    .withMessage('status must be operational|maintenance|closed')
];

const update = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer'),

  body('station_name')
    .optional()
    .isString().withMessage('station_name must be a string')
    .isLength({ max: 100 }).withMessage('station_name max length 100'),

  body('address')
    .optional()
    .isString().withMessage('address must be a string')
    .isLength({ max: 255 }).withMessage('address max length 255'),

  body('latitude')
    .optional()
    .isFloat().withMessage('latitude must be a decimal number'),

  body('longitude')
    .optional()
    .isFloat().withMessage('longitude must be a decimal number'),

  body('status')
    .optional()
    .isIn(['operational','maintenance','closed']).withMessage('status must be operational|maintenance|closed')
];

const remove = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer')
];

module.exports = { findById, create, update, remove };
