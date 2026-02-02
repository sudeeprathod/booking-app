require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/database');
const seedAdmin = require('./config/seedAdmin');
const eventRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Start server only after DB is connected (or fail with clear error)
async function start() {
  await connectDB();
  // Seed admin user (admin/admin) - skip in test
  if (process.env.NODE_ENV !== 'test') {
    await seedAdmin().catch((err) => console.error('Seed admin:', err.message));
  }
  if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or set PORT=3001 (e.g. PORT=3001 npm run dev)`);
        process.exit(1);
      }
      throw err;
    });
  }
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

// In-memory cache is automatically available (no connection needed)
app.use(
  express.static(
    path.join(__dirname, "../frontend/dist")
  )
);
app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );
});
// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api', authRoutes);
app.use('/api', eventRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

module.exports = app;
