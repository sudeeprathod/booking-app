const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const cacheService = require('./cacheService');

class EventService {
  async createEvent(eventData) {
    const event = new Event({
      name: eventData.name,
      totalSeats: eventData.totalSeats,
      availableSeats: eventData.totalSeats,
    });

    const savedEvent = await event.save();

    // Warm up in-memory cache
    cacheService.warmupCache(savedEvent._id.toString(), savedEvent.availableSeats);

    return savedEvent;
  }

  async getEventById(eventId) {
    return Event.findById(eventId);
  }

  async getAllEvents() {
    return Event.find({}).sort({ createdAt: -1 }).lean();
  }

  // Quick availability check using in-memory cache (non-blocking, for UI feedback)
  async checkAvailability(eventId, seatsRequested) {
    // Try cache first for fast response
    const cachedSeats = cacheService.getAvailableSeats(eventId);
    
    if (cachedSeats !== null) {
      return {
        available: cachedSeats >= seatsRequested,
        availableSeats: cachedSeats,
        source: 'cache',
      };
    }

    // Fallback to DB if cache miss
    const event = await Event.findById(eventId);
    if (!event) {
      return {
        available: false,
        availableSeats: 0,
        source: 'db',
      };
    }

    // Update cache for next time
    cacheService.setAvailableSeats(eventId, event.availableSeats);

    return {
      available: event.availableSeats >= seatsRequested,
      availableSeats: event.availableSeats,
      source: 'db',
    };
  }

  async bookSeats(eventId, userId, seatsRequested) {
    // Quick in-memory cache check for early rejection (optimization, not for safety)
    const cachedSeats = cacheService.getAvailableSeats(eventId);
    if (cachedSeats !== null && cachedSeats < seatsRequested) {
      throw new Error('Not enough seats available');
    }

    const session = await mongoose.startSession();
    session.startTransaction({
      maxCommitTimeMS: 30000,
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    try {
      // Use findOneAndUpdate with optimistic locking to prevent race conditions
      // This is the source of truth - cache is just for performance
      const event = await Event.findOneAndUpdate(
        {
          _id: eventId,
          availableSeats: { $gte: seatsRequested },
        },
        {
          $inc: { availableSeats: -seatsRequested },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      );

      if (!event) {
        await session.abortTransaction();
        session.endSession();
        throw new Error('Not enough seats available or event not found');
      }

      // Create booking
      const booking = new Booking({
        eventId: event._id,
        userId,
        seats: seatsRequested,
        status: 'active',
      });

      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Update in-memory cache after successful booking
      cacheService.setAvailableSeats(eventId, event.availableSeats);

      return {
        booking,
        event,
      };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  }

  async cancelBooking(eventId, bookingId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction({
      maxCommitTimeMS: 30000,
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    try {
      const userIdStr = typeof userId === 'string' ? userId : userId?.toString?.();
      // Find and update booking (only own booking)
      const booking = await Booking.findOneAndUpdate(
        {
          _id: bookingId,
          eventId,
          userId: userIdStr,
          status: 'active',
        },
        {
          status: 'cancelled',
        },
        {
          new: true,
          session,
        }
      );

      if (!booking) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        throw new Error('Booking not found or already cancelled');
      }

      // Restore seats to event
      const event = await Event.findByIdAndUpdate(
        eventId,
        {
          $inc: { availableSeats: booking.seats },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      );

      if (!event) {
        await session.abortTransaction();
        throw new Error('Event not found');
      }

      await session.commitTransaction();
      session.endSession();

      // Update in-memory cache after successful cancellation
      cacheService.setAvailableSeats(eventId, event.availableSeats);

      return {
        booking,
        event,
      };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  }

  async getBookingsByEventId(eventId) {
    return Booking.find({
      eventId,
      status: 'active',
    }).sort({ createdAt: -1 });
  }

  async getBookingsByUserId(userId) {
    const userIdStr = typeof userId === 'string' ? userId : userId?.toString?.();
    return Booking.find({
      userId: userIdStr,
      status: 'active',
    })
      .populate('eventId', 'name totalSeats availableSeats')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new EventService();
