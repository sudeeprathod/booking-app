const express = require('express');
const eventController = require('../controllers/eventController');
const { createEventSchema, bookSeatSchema } = require('../dto/eventDto');
const validate = require('../middleware/validation');
const { bookingLimiter } = require('../middleware/rateLimiter');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public
router.get('/events', eventController.listEvents.bind(eventController));
router.get('/event/:id', eventController.getEvent.bind(eventController));
router.get('/event/:id/availability', eventController.checkAvailability.bind(eventController));

// Admin only
router.post(
  '/event',
  authenticate,
  requireAdmin,
  validate(createEventSchema),
  eventController.createEvent.bind(eventController)
);

// Authenticated user
router.post(
  '/event/:id/book',
  authenticate,
  bookingLimiter,
  validate(bookSeatSchema),
  eventController.bookSeats.bind(eventController)
);

router.post(
  '/event/:id/cancel/:bookingId',
  authenticate,
  bookingLimiter,
  eventController.cancelBooking.bind(eventController)
);

router.get(
  '/user/bookings',
  authenticate,
  eventController.myBookings.bind(eventController)
);

// Event admin/list bookings (admin or keep for backward compat)
router.get(
  '/event/:id/bookings',
  eventController.getBookings.bind(eventController)
);

module.exports = router;
