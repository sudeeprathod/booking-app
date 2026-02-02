require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const connectDB = require('./config/database');
const seedAdmin = require('./config/seedAdmin');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   SECURITY & BODY PARSERS
========================= */
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

/* =========================
   RATE LIMITING
========================= */
app.use('/api', apiLimiter);

/* =========================
   API ROUTES
========================= */
app.use('/api', authRoutes);
app.use('/api', eventRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

/* =========================
   SERVE FRONTEND (VITE)
========================= */
const frontendPath = path.join(__dirname, '../../frontend/dist');

app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* =========================
   ERROR HANDLING
========================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

/* =========================
   START SERVER
========================= */
async function startServer() {
  try {
    await connectDB();

    if (process.env.NODE_ENV !== 'test') {
      await seedAdmin().catch(() => {});
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
