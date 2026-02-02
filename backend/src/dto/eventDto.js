const Joi = require('joi');

const createEventSchema = Joi.object({
  name: Joi.string().trim().required().max(200)
    .messages({
      'string.empty': 'Event name is required',
      'string.max': 'Event name cannot exceed 200 characters',
    }),
  totalSeats: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'Total seats must be a number',
      'number.min': 'Total seats must be at least 1',
      'any.required': 'Total seats is required',
    }),
});

const bookSeatSchema = Joi.object({
  seats: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'Seats must be a number',
      'number.min': 'Must book at least 1 seat',
      'any.required': 'Number of seats is required',
    }),
});

module.exports = {
  createEventSchema,
  bookSeatSchema,
};
