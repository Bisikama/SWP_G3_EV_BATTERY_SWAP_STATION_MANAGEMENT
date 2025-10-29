const { body, param } = require('express-validator');

const findById = [
  param('id')
  	.notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a uuid')
];

const findByVehicle = [
  param('vehicle_id')
  	.notEmpty().withMessage('vehicle_id is required')
    .isUUID().withMessage('vehicle_id must be a uuid')
];

const findByDriver = [
  param('driver_id')
  	.notEmpty().withMessage('driver_id is required')
    .isUUID().withMessage('driver_id must be a uuid')
];

const findActiveByVehicle = [
  param('vehicle_id')
  	.notEmpty().withMessage('vehicle_id is required')
    .isUUID().withMessage('vehicle_id must be a uuid')
];

const create = [
  body('plan_id')
  	.notEmpty().withMessage('plan_id is required')
    .isInt().withMessage('plan_id must be a integer'),

  body('vehicle_id')
  	.notEmpty().withMessage('vehicle_id is required')
    .isUUID().withMessage('vehicle_id must be a uuid'),

  body('invoice_id')
  	.notEmpty().withMessage('invoice_id is required')
    .isUUID().withMessage('invoice_id must be a uuid')
];

const cancel = [
  param('id')
  	.notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a uuid')
];

module.exports = { findById, findByVehicle, findByDriver, findActiveByVehicle, create, cancel };
