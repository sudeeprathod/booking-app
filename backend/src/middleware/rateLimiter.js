const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for booking endpoints
const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 booking requests per minute
  message: 'Too many booking requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  bookingLimiter,
};
