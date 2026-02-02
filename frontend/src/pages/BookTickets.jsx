import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { eventService } from '../services/api';

function BookTickets() {
  const [eventId, setEventId] = useState('');
  const [bookingData, setBookingData] = useState({
    userId: '',
    seats: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  const { data: bookingsData, isLoading } = useQuery(
    ['bookings', eventId],
    () => eventService.getBookings(eventId),
    {
      enabled: !!eventId,
      onError: () => {
        setError('Failed to fetch bookings');
      },
    }
  );

  const bookMutation = useMutation(
    () => eventService.bookSeats(eventId, bookingData),
    {
      onSuccess: (data) => {
        if (data.success) {
          setSuccess(`Successfully booked ${data.data.seatsBooked} seats! Remaining: ${data.data.remainingSeats}`);
          setBookingData({ userId: '', seats: '' });
          queryClient.invalidateQueries(['bookings', eventId]);
        } else {
          setError('Failed to book seats');
        }
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Error booking seats');
      },
    }
  );

  const cancelMutation = useMutation(
    (bookingId) => eventService.cancelBooking(eventId, bookingId),
    {
      onSuccess: (data) => {
        if (data.success) {
          setSuccess(`Booking cancelled! Available seats: ${data.data.updatedSeats}`);
          queryClient.invalidateQueries(['bookings', eventId]);
        } else {
          setError('Failed to cancel booking');
        }
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Error cancelling booking');
      },
    }
  );

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!eventId) {
      setError('Please enter an event ID');
      return;
    }

    bookMutation.mutate();
  };

  const handleCancel = (bookingId) => {
    if (!eventId) {
      setError('Please enter an event ID');
      return;
    }

    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelMutation.mutate(bookingId);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: name === 'seats' ? parseInt(value, 10) || '' : value,
    }));
    setError('');
    setSuccess('');
  };

  const bookings = bookingsData?.data || [];
  const availableSeats = bookingsData?.data
    ? bookings.reduce((sum, b) => sum + b.seats, 0)
    : 0;

  return (
    <div>
      <div className="card">
        <h1>Book/Cancel Tickets</h1>

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
                setSuccess('');
              }}
              placeholder="Enter event ID"
              required
            />
          </label>
        </div>

        {eventId && (
          <>
            {isLoading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <div className="card">
                  <h2>Book Tickets</h2>
                  <form onSubmit={handleBookSubmit}>
                    <div className="form-group">
                      <label htmlFor="userId">
                        User ID
                        <input
                          type="text"
                          id="userId"
                          name="userId"
                          value={bookingData.userId}
                          onChange={handleChange}
                          required
                        />
                      </label>
                    </div>

                    <div className="form-group">
                      <label htmlFor="seats">
                        Number of Seats
                        <input
                          type="number"
                          id="seats"
                          name="seats"
                          value={bookingData.seats}
                          onChange={handleChange}
                          required
                          min="1"
                        />
                      </label>
                    </div>

                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={bookMutation.isLoading}
                    >
                      {bookMutation.isLoading ? 'Booking...' : 'Book Seats'}
                    </button>
                  </form>
                </div>

                <div className="card">
                  <h2>Active Bookings</h2>
                  {bookings.length === 0 ? (
                    <p>No active bookings for this event</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>User ID</th>
                          <th>Seats</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.bookingId}>
                            <td>{booking.bookingId}</td>
                            <td>{booking.userId}</td>
                            <td>{booking.seats}</td>
                            <td>{new Date(booking.date).toLocaleString()}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleCancel(booking.bookingId)}
                                disabled={cancelMutation.isLoading}
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BookTickets;
