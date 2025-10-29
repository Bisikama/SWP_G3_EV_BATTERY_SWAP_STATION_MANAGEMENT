const { param } = require('express-validator');

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isInt().withMessage('id must be an integer')
];

const findByStation = [
  param('station_id')
    .notEmpty().withMessage('station_id is required')
    .isInt().withMessage('station_id must be an integer')
];

const findEmptySlot = [
  param('cabinet_id')
    .notEmpty().withMessage('cabinet_id is required')
    .isInt().withMessage('cabinet_id must be an integer')
];

const chargeFull = [
  param('cabinet_id')
    .notEmpty().withMessage('cabinet_id is required')
    .isInt().withMessage('cabinet_id must be an integer')
];

module.exports = { findById, findByStation, findEmptySlot, chargeFull };
