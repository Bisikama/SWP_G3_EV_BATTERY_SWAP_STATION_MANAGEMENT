// src/validators/vehicleModelValidator.js
const { body } = require('express-validator');

exports.vehicleModelRules = {
  name: body('name').optional()
    .isString().withMessage('Name must be a string')
    .isLength({ max: 100 }).withMessage('Name max length is 100'),

  brand: body('brand').optional()
    .isString().withMessage('Brand must be a string')
    .isLength({ max: 50 }).withMessage('Brand max length is 50'),

  avg_energy_usage: body('avg_energy_usage')
    .isFloat({ gt: 0 }).withMessage('Average energy usage must be a positive decimal number')
};

