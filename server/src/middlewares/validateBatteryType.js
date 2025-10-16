const { body } = require('express-validator');

exports.batteryTypeRules = {
  battery_type_code: body('battery_type_code')
    .exists('falsy')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Battery type code must be 1->100 chars'),

  nominal_capacity: body('nominal_capacity')
    .isFloat({ gt: 0 })
    .withMessage('Nominal capacity must be a positive decimal number'),

  nominal_voltage: body('nominal_voltage')
    .isFloat({ gt: 0 })
    .withMessage('Nominal voltage must be a positive decimal number'),

  min_voltage: body('min_voltage')
    .isFloat({ gt: 0 })
    .withMessage('Min voltage must be a positive decimal number'),

  max_voltage: body('max_voltage')
    .isFloat({ gt: 0 })
    .withMessage('Max voltage must be a positive decimal number'),

  rated_charge_current: body('rated_charge_current')
    .isFloat({ gt: 0 })
    .withMessage('Rated charge current must be a positive decimal number'),

  max_charge_current: body('max_charge_current')
    .isFloat({ gt: 0 })
    .withMessage('Max charge current must be a positive decimal number'),

  cell_chemistry: body('cell_chemistry')
    .isIn(['Li-ion', 'LFP'])
    .withMessage('Cell chemistry must be either Li-ion or LFP'),
};
