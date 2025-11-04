const { body, param, query } = require('express-validator');

const findAll = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('pageSize')
    .optional()
    .isInt({ min: 1 }).withMessage('pageSize must be a positive integer')
];

const findCurrent = [
  query('staff_id')
    .optional()
    .isUUID().withMessage('staff_id must be a valid UUID'),

  query('station_id')
    .optional()
    .isInt().withMessage('station_id must be an integer'),
];

const findById = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a valid UUID'),
];

const create = [
  body('staff_id')
    .notEmpty().withMessage('staff_id is required')
    .isUUID().withMessage('staff_id must be a valid UUID'),

  body('station_id')
    .notEmpty().withMessage('station_id is required')
    .isInt().withMessage('station_id must be an integer'),

  body('start_time')
    .notEmpty().withMessage('start_time is required')
    .isISO8601().withMessage('start_time must be a valid ISO8601 date')
    .custom(value => {
      const start = new Date(value);
      if (start <= new Date()) {
        throw new Error('start_time must be greater than current time');
      }
      return true;
    }),

  body('end_time')
    .notEmpty().withMessage('end_time is required')
    .isISO8601().withMessage('end_time must be a valid ISO8601 date')
    .custom((value, { req }) => {
      const end = new Date(value);
      const start = new Date(req.body.start_time);
      if (end <= start) {
        throw new Error('end_time must be greater than start_time');
      }
      return true;
    }),
];

const update = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a valid UUID'),

  body('staff_id').optional().isUUID().withMessage('staff_id must be a valid UUID'),
  body('station_id').optional().isInt().withMessage('station_id must be an integer'),
  body('start_time').optional().isISO8601().withMessage('start_time must be a valid date'),
  body('end_time').optional().isISO8601().withMessage('end_time must be a valid date'),

  body().custom(value => {
    if ((value.start_time && !value.end_time) || (!value.start_time && value.end_time)) {
      throw new Error('Both start_time and end_time must be provided together');
    }
    return true;
  }),

  body().custom(value => {
    if (!value.start_time || !value.end_time) return true;
    const start = new Date(value.start_time);
    const end = new Date(value.end_time);
    if (start <= new Date()) {
      throw new Error('start_time must be greater than current time');
    }
    if (end <= start) {
      throw new Error('end_time must be greater than start_time');
    }
    return true;
  }),
];

const remove = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a valid UUID'),
];

module.exports = {
  findAll,
  findCurrent,
  findById,
  create,
  update,
  remove
};
