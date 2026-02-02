const request = require('supertest');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { connectWithMongoMemoryServer, stopMongoMemoryServer } = require('./mongoHelper');

let app;
let adminToken;
let userToken;
let userId;

async function getAuthTokens() {
  const admin = await User.create({ username: 'admin', password: 'admin', role: 'admin' });
  const user = await User.create({ username: 'user1', password: 'password123', role: 'user' });
  userId = user._id.toString();

  const adminLogin = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin' });
  const userLogin = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'password123' });

  adminToken = adminLogin.body.data?.token;
  userToken = userLogin.body.data?.token;
}

describe('Event Controller', () => {
  beforeAll(async () => {
    const mongoUri = await connectWithMongoMemoryServer();
    process.env.MONGODB_URI = mongoUri;
    app = require('../server');
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) resolve();
      else mongoose.connection.once('connected', resolve);
    });
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
    await User.deleteMany({});
    await getAuthTokens();
  });

  describe('GET /api/events', () => {
    it('should list all events (public)', async () => {
      await Event.create({ name: 'E1', totalSeats: 10, availableSeats: 10 });
      const response = await request(app).get('/api/events').expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].soldOut).toBe(false);
    });

    it('should show soldOut when no seats', async () => {
      await Event.create({ name: 'E2', totalSeats: 10, availableSeats: 0 });
      const response = await request(app).get('/api/events').expect(200);
      expect(response.body.data[0].soldOut).toBe(true);
    });
  });

  describe('GET /api/event/:id', () => {
    it('should return single event (public)', async () => {
      const event = await Event.create({ name: 'Concert', totalSeats: 100, availableSeats: 50 });
      const response = await request(app).get(`/api/event/${event._id}`).expect(200);
      expect(response.body.data.name).toBe('Concert');
      expect(response.body.data.availableSeats).toBe(50);
    });

    it('should return 404 for invalid id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app).get(`/api/event/${fakeId}`).expect(404);
    });
  });

  describe('POST /api/event', () => {
    it('should create event as admin', async () => {
      const response = await request(app)
        .post('/api/event')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Concert A', totalSeats: 100 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Concert A');
      expect(response.body.data.availableSeats).toBe(100);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/event')
        .send({ name: 'Concert A', totalSeats: 100 })
        .expect(401);
    });

    it('should return 403 for non-admin', async () => {
      await request(app)
        .post('/api/event')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Concert A', totalSeats: 100 })
        .expect(403);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/event')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', totalSeats: -1 })
        .expect(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/event/:id/book', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({ name: 'Concert A', totalSeats: 100, availableSeats: 100 });
      eventId = event._id.toString();
    });

    it('should book seats when authenticated', async () => {
      const response = await request(app)
        .post(`/api/event/${eventId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seats: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.seatsBooked).toBe(2);
      expect(response.body.data.remainingSeats).toBe(98);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post(`/api/event/${eventId}/book`)
        .send({ seats: 2 })
        .expect(401);
    });

    it('should return 400 when not enough seats', async () => {
      await request(app)
        .post(`/api/event/${eventId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seats: 50 });

      const response = await request(app)
        .post(`/api/event/${eventId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seats: 60 })
        .expect(400);
      expect(response.body.message).toContain('Not enough seats');
    });

    it('should return 400 for invalid seats', async () => {
      const response = await request(app)
        .post(`/api/event/${eventId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ seats: 0 })
        .expect(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user/bookings', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({ name: 'Concert A', totalSeats: 100, availableSeats: 95 });
      eventId = event._id.toString();
      await Booking.create({
        eventId: event._id,
        userId,
        seats: 5,
        status: 'active',
      });
    });

    it('should return my bookings when authenticated', async () => {
      const response = await request(app)
        .get('/api/user/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].eventName).toBe('Concert A');
      expect(response.body.data[0].seats).toBe(5);
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/user/bookings').expect(401);
    });
  });

  describe('POST /api/event/:id/cancel/:bookingId', () => {
    let eventId;
    let bookingId;

    beforeEach(async () => {
      const event = await Event.create({ name: 'Concert A', totalSeats: 100, availableSeats: 98 });
      eventId = event._id.toString();
      const booking = await Booking.create({
        eventId: event._id,
        userId,
        seats: 2,
        status: 'active',
      });
      bookingId = booking._id.toString();
    });

    it('should cancel own booking and restore seats', async () => {
      const response = await request(app)
        .post(`/api/event/${eventId}/cancel/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedSeats).toBe(100);
      const booking = await Booking.findById(bookingId);
      expect(booking.status).toBe('cancelled');
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post(`/api/event/${eventId}/cancel/${bookingId}`)
        .expect(401);
    });

    it('should return 403 when cancelling other user booking', async () => {
      const otherUser = await User.create({ username: 'other', password: 'pass123', role: 'user' });
      const otherEvent = await Event.create({ name: 'Other Event', totalSeats: 50, availableSeats: 49 });
      const otherBooking = await Booking.create({
        eventId: otherEvent._id,
        userId: otherUser._id.toString(),
        seats: 1,
        status: 'active',
      });
      const otherEventId = otherEvent._id.toString();
      const otherBookingId = otherBooking._id.toString();

      const response = await request(app)
        .post(`/api/event/${otherEventId}/cancel/${otherBookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/event/:id/bookings', () => {
    let eventId;

    beforeEach(async () => {
      const event = await Event.create({ name: 'Concert A', totalSeats: 100, availableSeats: 95 });
      eventId = event._id.toString();
      await Booking.create([
        { eventId: event._id, userId: 'u1', seats: 2, status: 'active' },
        { eventId: event._id, userId: 'u2', seats: 3, status: 'active' },
        { eventId: event._id, userId: 'u3', seats: 1, status: 'cancelled' },
      ]);
    });

    it('should fetch all active bookings for an event', async () => {
      const response = await request(app).get(`/api/event/${eventId}/bookings`).expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app).get(`/api/event/${fakeId}/bookings`).expect(404);
    });
  });
});
