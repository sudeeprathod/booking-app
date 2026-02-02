const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required'],
    index: true,
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    trim: true,
    index: true,
  },
  seats: {
    type: Number,
    required: [true, 'Number of seats is required'],
    min: [1, 'Must book at least 1 seat'],
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active',
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
bookingSchema.index({ eventId: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
