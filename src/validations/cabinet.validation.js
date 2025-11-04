const { param, query } = require('express-validator');

const findAll = [
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

const findByStation = [
  param('station_id')
    .notEmpty().withMessage('station_id is required')
    .isInt().withMessage('station_id must be an integer'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1 }).withMessage('pageSize must be a positive integer')
];

const chargeFull = [
  param('cabinet_id')
    .notEmpty().withMessage('cabinet_id is required')
    .isInt().withMessage('cabinet_id must be an integer')
];

module.exports = { findAll, findById, findByStation, chargeFull };
