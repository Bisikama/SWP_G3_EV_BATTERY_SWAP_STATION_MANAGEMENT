const { param, query, body } = require('express-validator');

const findAll = [
  param('station_id')
    .optional()
    .isInt().withMessage('station_id must be an integer'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1 }).withMessage('pageSize must be a positive integer')
];

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer')
];

const create = [
  body('station_id')
    .notEmpty().withMessage('station_id is required')
    .isInt({ min: 1 }).withMessage('station_id must be a positive integer'),

  body('battery_capacity')
    .notEmpty().withMessage('battery_capacity is required')
    .isInt({ min: 1 }).withMessage('battery_capacity must be a positive integer'),

  body('power_capacity_kw')
    .notEmpty().withMessage('power_capacity_kw is required')
    .isFloat({ min: 0 }).withMessage('power_capacity_kw must be a non-negative number')
];

const chargeFull = [
  param('cabinet_id')
    .notEmpty().withMessage('cabinet_id is required')
    .isInt().withMessage('cabinet_id must be an integer')
];

module.exports = { findAll, findById, create, chargeFull };
