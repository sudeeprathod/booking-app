const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters'],
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Total seats must be at least 1'],
  },
  availableSeats: {
    type: Number,
    required: true,
    min: [0, 'Available seats cannot be negative'],
  },
}, {
  timestamps: true,
  versionKey: '__v', // Enable optimistic locking
});

// Index for faster queries
eventSchema.index({ name: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
