const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().trim().required()
    .messages({ 'string.empty': 'Username is required' }),
  password: Joi.string().required()
    .messages({ 'string.empty': 'Password is required' }),
});

const registerSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).required()
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters',
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters',
    }),
});

module.exports = {
  loginSchema,
  registerSchema,
};
