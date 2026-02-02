const eventService = require('../services/eventService');

class EventController {
  async listEvents(req, res) {
    try {
      const events = await eventService.getAllEvents();
      res.status(200).json({
        success: true,
        data: events.map((e) => ({
          eventId: e._id.toString(),
          name: e.name,
          totalSeats: e.totalSeats,
          availableSeats: e.availableSeats,
          soldOut: e.availableSeats === 0,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching events',
      });
    }
  }

  async getEvent(req, res) {
    try {
      const { id: eventId } = req.params;
      const event = await eventService.getEventById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }
      res.status(200).json({
        success: true,
        data: {
          eventId: event._id.toString(),
          name: event.name,
          totalSeats: event.totalSeats,
          availableSeats: event.availableSeats,
          soldOut: event.availableSeats === 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching event',
      });
    }
  }

  async createEvent(req, res) {
    try {
      const event = await eventService.createEvent(req.body);

      res.status(201).json({
        success: true,
        data: {
          eventId: event._id.toString(),
          name: event.name,
          totalSeats: event.totalSeats,
          availableSeats: event.availableSeats,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating event',
      });
    }
  }

  async checkAvailability(req, res) {
    try {
      const { id: eventId } = req.params;
      const { seats } = req.query;

      if (!seats || isNaN(seats)) {
        return res.status(400).json({
          success: false,
          message: 'Seats parameter is required and must be a number',
        });
      }

      const result = await eventService.checkAvailability(eventId, parseInt(seats, 10));

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error checking availability',
      });
    }
  }

  async bookSeats(req, res) {
    try {
      const { id: eventId } = req.params;
      const { seats } = req.body;
      const userId = req.user._id.toString();

      // Check if event exists
      const event = await eventService.getEventById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      const result = await eventService.bookSeats(eventId, userId, seats);

      res.status(200).json({
        success: true,
        data: {
          bookingId: result.booking._id.toString(),
          eventId: result.event._id.toString(),
          userId: result.booking.userId,
          seatsBooked: result.booking.seats,
          remainingSeats: result.event.availableSeats,
        },
      });
    } catch (error) {
      if (error.message === 'Not enough seats available or event not found' || error.message === 'Not enough seats available') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error booking seats',
      });
    }
  }

  async cancelBooking(req, res) {
    try {
      const { id: eventId, bookingId } = req.params;
      const userId = req.user._id.toString();

      const result = await eventService.cancelBooking(eventId, bookingId, userId);

      res.status(200).json({
        success: true,
        data: {
          eventId: result.event._id.toString(),
          bookingId: result.booking._id.toString(),
          updatedSeats: result.event.availableSeats,
        },
      });
    } catch (error) {
      if (error.message === 'Booking not found or already cancelled') {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel your own booking',
        });
      }
      if (error.message === 'Event not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Error cancelling booking',
      });
    }
  }

  async myBookings(req, res) {
    try {
      const userId = req.user._id.toString();
      const bookings = await eventService.getBookingsByUserId(userId);
      res.status(200).json({
        success: true,
        data: bookings.map((b) => ({
          bookingId: b._id.toString(),
          eventId: b.eventId?._id?.toString() || b.eventId?.toString(),
          eventName: b.eventId?.name,
          seats: b.seats,
          date: b.createdAt,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching bookings',
      });
    }
  }

  async getBookings(req, res) {
    try {
      const { id: eventId } = req.params;

      // Check if event exists
      const event = await eventService.getEventById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      const bookings = await eventService.getBookingsByEventId(eventId);

      res.status(200).json({
        success: true,
        data: bookings.map((booking) => ({
          bookingId: booking._id.toString(),
          userId: booking.userId,
          seats: booking.seats,
          date: booking.createdAt,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching bookings',
      });
    }
  }
}

module.exports = new EventController();
