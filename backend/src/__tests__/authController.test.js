const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const { connectWithMongoMemoryServer, stopMongoMemoryServer } = require('./mongoHelper');

let app;
let userToken;

describe('Auth Controller', () => {
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
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.role).toBe('user');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '12345' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for duplicate username', async () => {
      await User.create({ username: 'existing', password: 'password123', role: 'user' });
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'existing', password: 'password123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({ username: 'admin', password: 'admin', role: 'admin' });
    });

    it('should login with admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('admin');
      expect(response.body.data.user.role).toBe('admin');
      userToken = response.body.data.token;
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unknown user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nobody', password: 'admin' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return user with valid token', async () => {
      const user = await User.create({ username: 'meuser', password: 'pass123', role: 'user' });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'meuser', password: 'pass123' });
      const token = loginRes.body.data.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('meuser');
    });
  });
});
