// Simple in-memory cache for availability checks
// Note: This is for performance optimization only.
// All actual bookings still go through MongoDB transactions for safety.

class CacheService {
  constructor() {
    // Map<eventId, availableSeats>
    this.cache = new Map();
    // Map<eventId, timestamp> for optional TTL (not implemented but structure ready)
    this.timestamps = new Map();
  }

  // Get available seats from cache
  getAvailableSeats(eventId) {
    return this.cache.get(eventId) ?? null;
  }

  // Set available seats in cache
  setAvailableSeats(eventId, availableSeats) {
    this.cache.set(eventId, availableSeats);
    this.timestamps.set(eventId, Date.now());
  }

  // Invalidate cache for an event
  invalidateEvent(eventId) {
    this.cache.delete(eventId);
    this.timestamps.delete(eventId);
  }

  // Update available seats (atomic decrement/increment in memory)
  updateAvailableSeats(eventId, delta) {
    const current = this.cache.get(eventId);
    if (current === undefined) {
      return null; // Not in cache
    }
    const newValue = current + delta;
    this.cache.set(eventId, newValue);
    this.timestamps.set(eventId, Date.now());
    return newValue;
  }

  // Warm up cache from database
  warmupCache(eventId, availableSeats) {
    this.setAvailableSeats(eventId, availableSeats);
  }

  // Clear all cache (useful for testing or reset)
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Get cache size (for monitoring)
  size() {
    return this.cache.size;
  }
}

module.exports = new CacheService();
