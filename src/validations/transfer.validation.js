const { body, param } = require('express-validator');

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a valid UUID'),
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
    .isUUID().withMessage('transfer_request_id must be a valid UUID'),

  body('transfer_orders')
    .isArray({ min: 1 }).withMessage('transfer_orders must be a non-empty array'),

  body('transfer_orders.*.source_station_id')
    .notEmpty().withMessage('source_station_id is required for each transfer order')
    .isInt({ min: 1 }).withMessage('source_station_id must be a positive integer'),

  body('transfer_orders.*.target_station_id')
    .notEmpty().withMessage('target_station_id is required for each transfer order')
    .isInt({ min: 1 }).withMessage('target_station_id must be a positive integer'),

  body('transfer_orders.*.transfer_quantity')
    .notEmpty().withMessage('transfer_quantity is required for each transfer order')
    .isInt({ min: 1 }).withMessage('transfer_quantity must be a positive integer'),
];

const confirm = [
  param('transfer_order_id')
    .notEmpty().withMessage('transfer_order_id is required')
    .isUUID().withMessage('transfer_order_id must be a valid UUID'),
];

const reject = [
  param('transfer_request_id')
    .notEmpty().withMessage('transfer_request_id is required')
    .isUUID().withMessage('transfer_request_id must be a valid UUID'),
];

const cancel = [
  param('transfer_request_id')
    .notEmpty().withMessage('transfer_request_id is required')
    .isUUID().withMessage('transfer_request_id must be a valid UUID'),
];

module.exports = {
  findById,
  request,
  approve,
  confirm,
  reject,
  cancel,
};
