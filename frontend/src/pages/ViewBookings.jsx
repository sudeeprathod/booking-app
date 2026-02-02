import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { eventService } from '../services/api';

function ViewBookings() {
  const [eventId, setEventId] = useState('');
  const [error, setError] = useState('');

  const { data: bookingsData, isLoading, refetch } = useQuery(
    ['bookings', eventId],
    () => eventService.getBookings(eventId),
    {
      enabled: false,
      onError: (err) => {
        setError(err.response?.data?.message || 'Failed to fetch bookings');
      },
      onSuccess: () => {
        setError('');
      },
    }
  );

  const handleFetch = (e) => {
    e.preventDefault();
    if (!eventId) {
      setError('Please enter an event ID');
      return;
    }
    refetch();
  };

  const bookings = bookingsData?.data || [];
  const totalBookedSeats = bookings.reduce((sum, b) => sum + b.seats, 0);

  return (
    <div className="card">
      <h1>View Bookings</h1>

      <form onSubmit={handleFetch}>
        <div className="form-group">
          <label htmlFor="eventId">
            Event ID
            <input
              type="text"
              id="eventId"
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setError('');
              }}
              placeholder="Enter event ID"
              required
            />
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Fetch Bookings'}
        </button>
      </form>

      {bookingsData && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h2>Bookings for Event: {eventId}</h2>
          <p>
            <strong>Total Booked Seats:</strong> {totalBookedSeats}
          </p>
          <p>
            <strong>Total Bookings:</strong> {bookings.length}
          </p>

          {bookings.length === 0 ? (
            <p>No bookings found for this event</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>User ID</th>
                  <th>Seats</th>
                  <th>Booking Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.bookingId}>
                    <td>{booking.bookingId}</td>
                    <td>{booking.userId}</td>
                    <td>{booking.seats}</td>
                    <td>{new Date(booking.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default ViewBookings;
