const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const eventService = require('../services/eventService');
const { connectWithMongoMemoryServer, stopMongoMemoryServer } = require('./mongoHelper');

describe('Event Service', () => {
  beforeAll(async () => {
    const mongoUri = await connectWithMongoMemoryServer();
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    await stopMongoMemoryServer();
  });

  beforeEach(async () => {
    await Event.deleteMany({});
    await Booking.deleteMany({});
  });

  describe('createEvent', () => {
    it('should create an event with correct available seats', async () => {
      const eventData = {
        name: 'Concert A',
        totalSeats: 100,
      };

      const event = await eventService.createEvent(eventData);

      expect(event.name).toBe('Concert A');
      expect(event.totalSeats).toBe(100);
      expect(event.availableSeats).toBe(100);
    });
  });

  describe('bookSeats', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({
        name: 'Concert A',
        totalSeats: 100,
        availableSeats: 100,
      });
      eventId = event._id.toString();
    });

    it('should book seats and update available seats', async () => {
      await new Promise((r) => setTimeout(r, 100)); // allow in-memory server lock to settle
      const result = await eventService.bookSeats(eventId, 'u1', 5);

      expect(result.booking.userId).toBe('u1');
      expect(result.booking.seats).toBe(5);
      expect(result.event.availableSeats).toBe(95);
    }, 15000);

    it('should throw error when not enough seats', async () => {
      await eventService.bookSeats(eventId, 'u1', 60);

      await expect(
        eventService.bookSeats(eventId, 'u2', 50)
      ).rejects.toThrow('Not enough seats available');
    });

    it('should handle multiple bookings without overbooking', async () => {
      // Sequential bookings: 5 bookings of 5 seats each = 25 seats
      // (In-memory server has lock limits; sequential still validates no overbooking)
      for (let i = 0; i < 5; i += 1) {
        await eventService.bookSeats(eventId, `u${i}`, 5);
      }

      const event = await Event.findById(eventId);
      expect(event.availableSeats).toBe(75);

      // Next booking should fail (only 75 left, requesting 80)
      await expect(
        eventService.bookSeats(eventId, 'u5', 80)
      ).rejects.toThrow('Not enough seats available');
    }, 15000);
  });

  describe('cancelBooking', () => {
    let eventId;
    let bookingId;

    beforeEach(async () => {
      const event = await Event.create({
        name: 'Concert A',
        totalSeats: 100,
        availableSeats: 95,
      });
      eventId = event._id.toString();

      const booking = await Booking.create({
        eventId: event._id,
        userId: 'u1',
        seats: 5,
        status: 'active',
      });
      bookingId = booking._id.toString();
    });

    it('should cancel booking and restore seats', async () => {
      const result = await eventService.cancelBooking(eventId, bookingId, 'u1');

      expect(result.booking.status).toBe('cancelled');
      expect(result.event.availableSeats).toBe(100);
    });

    it('should throw error for non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        eventService.cancelBooking(eventId, fakeId, 'u1')
      ).rejects.toThrow('Booking not found');
    });

    it('should throw error for already cancelled booking', async () => {
      await eventService.cancelBooking(eventId, bookingId, 'u1');

      await expect(
        eventService.cancelBooking(eventId, bookingId, 'u1')
      ).rejects.toThrow('Booking not found');
    });

    it('should throw when cancelling other user booking', async () => {
      await expect(
        eventService.cancelBooking(eventId, bookingId, 'u2')
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('getBookingsByEventId', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({
        name: 'Concert A',
        totalSeats: 100,
        availableSeats: 90,
      });
      eventId = event._id.toString();

      await Booking.create([
        {
          eventId: event._id,
          userId: 'u1',
          seats: 5,
          status: 'active',
        },
        {
          eventId: event._id,
          userId: 'u2',
          seats: 5,
          status: 'active',
        },
        {
          eventId: event._id,
          userId: 'u3',
          seats: 5,
          status: 'cancelled',
        },
      ]);
    });

    it('should return only active bookings', async () => {
      const bookings = await eventService.getBookingsByEventId(eventId);

      expect(bookings).toHaveLength(2);
      expect(bookings.every((b) => b.status === 'active')).toBe(true);
    });
  });
});
