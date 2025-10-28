const { body, param } = require('express-validator');

const findById = [
  param('id')
  	.notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a uuid')
];

const create = [
  body('staff_id')
		.notEmpty().withMessage('staff_id is required')
		.isUUID().withMessage('staff_id must be a uuid'),

  body('station_id')
		.exists({ values: 'null' }).withMessage('station_id is required')
		.isInt().withMessage('station_id must be an integer'),

  body('start_time')
		.notEmpty().withMessage('start_time is required')
		.isISO8601().withMessage('start_time must be a valid date')
		.custom((value) => {
      const start = new Date(value);
      const now = new Date();
      if (start <= now) {
        throw new Error('start_time must be greater than current time');
      }
      return true;
    }),

  body('end_time')
		.notEmpty().withMessage('end_time is required')
		.isISO8601().withMessage('end_time must be a valid date')
		.custom((value, { req }) => {
      const end = new Date(value);
      const start = new Date(req.body.start_time);
      if (end <= start) {
        throw new Error('end_time must be greater than start_time');
      }
      return true;
    })
];

const update = [
  param('id')
    .notEmpty().withMessage('id is required')
    .isUUID().withMessage('id must be a uuid'),

	body('staff_id')
		.optional()
		.isUUID().withMessage('staff_id must be a uuid'),

  body('station_id')
		.optional()
		.isInt().withMessage('station_id must be an integer'),

  body('start_time')
    .optional()
    .isISO8601().withMessage('start_time must be a valid date'),
    
  body('end_time')
    .optional()
    .isISO8601().withMessage('end_time must be a valid date'),

  // custom rule: both or none
  body()
    .custom((value) => {
      const hasStart = value.start_time !== undefined;
      const hasEnd = value.end_time !== undefined;

      if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
        throw new Error('Both start_time and end_time must be provided together');
      }
      return true;
    }),

  // custom rule: start_time > now, end_time > start_time
  body()
    .custom((value) => {
      if (!value.start_time) return true; // skip if neither provided

      const start = new Date(value.start_time);
      const end = new Date(value.end_time);
      const now = new Date();

      if (start <= now) {
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
    .isUUID().withMessage('id must be a uuid')
];

module.exports = { findById, create, update, remove };
