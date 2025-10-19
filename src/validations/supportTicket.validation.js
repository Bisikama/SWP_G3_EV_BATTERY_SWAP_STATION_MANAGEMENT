const { body, param } = require('express-validator');

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
		.isUUID().withMessage('id must be a uuid')
];

const findByCreator = [
  param('id')
    .notEmpty().withMessage('id is required')
		.isUUID().withMessage('id must be a uuid')
];

const findByResolver = [
  param('id')
    .notEmpty().withMessage('id is required')
		.isUUID().withMessage('id must be a uuid')
];

const create = [
  body('subject')
		.notEmpty().withMessage('subject is required')
		.isIn(['battery_issue','vehicle_issue','station_issue','account_issue','payment_issue','other'])
		.withMessage('subject must be battery_issue|vehicle_issue|station_issue|account_issue|payment_issue|other'),

  body('description')
		.notEmpty().withMessage('description is required')
		.isString().withMessage('description must be a string')
];

const updateStatus = [
  param('id')
		.notEmpty().withMessage('id is required')
		.isUUID().withMessage('id must be a uuid'),
];

module.exports = { findById, findByCreator, findByResolver, create, updateStatus };
