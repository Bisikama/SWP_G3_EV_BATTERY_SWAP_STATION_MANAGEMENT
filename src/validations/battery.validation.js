const { body, param, query } = require('express-validator');

const findAll = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1 }).withMessage('pageSize must be a positive integer')
];

const countByStationAndType = [
  query('stationName').optional().isString().withMessage('stationName must be a string'),
  query('batteryTypeCode').optional().isString().withMessage('batteryTypeCode must be a string'),
  body('stationName').optional().isString().withMessage('stationName must be a string'),
  body('batteryTypeCode').optional().isString().withMessage('batteryTypeCode must be a string'),
];

const findByVehicle = [
  param('vehicle_id')
    .notEmpty().withMessage('vehicle_id is required')
    .isUUID().withMessage('vehicle_id must be a valid UUID'),
];

const createByVehicle = [
  param('vehicle_id')
    .notEmpty().withMessage('vehicle_id is required')
    .isInt().withMessage('vehicle_id must be an integer'),
];

const getBatteryAtStation = [
  param('station_id')
    .notEmpty().withMessage('station_id is required')
    .isInt().withMessage('station_id must be an integer'),
];

const update = [
  param('battery_id')
    .isUUID()
    .withMessage('Invalid battery ID format, must be UUID'),

  body('current_soc')
    .exists().withMessage('current_soc is required')
    .isFloat({ min: 0, max: 100 }).withMessage('current_soc must be between 0 and 100'),

  body('current_soh')
    .exists().withMessage('current_soh is required')
    .isFloat({ min: 0, max: 100 }).withMessage('current_soh must be between 0 and 100')
];

module.exports = {
	findAll,
  countByStationAndType,
  findByVehicle,
  createByVehicle,
  getBatteryAtStation,
	update
};
