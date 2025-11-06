const { body, param, query } = require('express-validator');

const findAllRequest = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1 }).withMessage('pageSize must be a positive integer'),

  query('station_id')
    .optional()
    .isInt({ min: 1 }).withMessage('station_id must be a positive integer')
];

const findAllOrder = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1 }).withMessage('pageSize must be a positive integer'),

  query('source_station_id')
    .optional()
    .isInt({ min: 1 }).withMessage('source_station_id must be a positive integer'),

  query('target_station_id')
    .optional()
    .isInt({ min: 1 }).withMessage('target_station_id must be a positive integer')
];

const findRequestById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a valid UUID'),
];

const findOrderById = [
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

const create = [
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
  findAllRequest,
  findAllOrder,
  findRequestById,
  findOrderById,
  request,
  approve,
  create,
  confirm,
  reject,
  cancel,
};
