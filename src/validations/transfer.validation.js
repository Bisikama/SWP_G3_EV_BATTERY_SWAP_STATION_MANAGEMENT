const { body, param } = require('express-validator');

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a uuid')
];

const request = [
  body('request_quantity')
    .notEmpty().withMessage('request_quantity is required')
    .isInt({ min: 1 }).withMessage('request_quantity must be a positive integer'),

  body('notes')
    .optional()
    .isString().withMessage('notes must be a string'),
];

const approve = [
  param('transfer_request_id')
    .notEmpty().withMessage('transfer_request_id is required')
    .isUUID().withMessage('transfer_request_id must be a uuid'),

  body('transfer_details')
    .isArray({ min: 1 }).withMessage('transfer_details must be a non-empty array'),

  body('transfer_details.*.station_id')
    .notEmpty().withMessage('station_id is required for each transfer detail')
    .isInt({ min: 1 }).withMessage('station_id must be a positive integer'),

  body('transfer_details.*.transfer_quantity')
    .notEmpty().withMessage('transfer_quantity is required for each transfer detail')
    .isInt({ min: 1 }).withMessage('transfer_quantity must be a positive integer'),
];

const confirm = [
  param('transfer_detail_id')
    .notEmpty().withMessage('transfer_detail_id is required')
    .isUUID().withMessage('transfer_detail_id must be a uuid')
];

module.exports = {
  findById,
  request,
  approve,
  confirm
};
