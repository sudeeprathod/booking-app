const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error) {
    const isAuthError = error.message && (
      error.message.includes('bad auth') ||
      error.message.includes('Authentication failed') ||
      error.code === 18
    );
    if (isAuthError && process.env.NODE_ENV !== 'test') {
      console.error('MongoDB authentication failed. Check your .env:');
      console.error('  - MONGODB_URI should have the correct username and password');
      console.error('  - For MongoDB Atlas: use the DB user password (not your account password)');
      console.error('  - For local MongoDB: use mongodb://localhost:27017/bookingapp (no auth)');
    } else {
      console.error(`Error: ${error.message}`);
    }
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
