import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { eventService } from '../services/api';

function MyBookings() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery('myBookings', eventService.getMyBookings);

  const cancelMutation = useMutation(
    ({ eventId, bookingId }) => eventService.cancelBooking(eventId, bookingId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myBookings');
        queryClient.invalidateQueries('events');
      },
    }
  );

  const handleCancel = (eventId, bookingId) => {
    if (window.confirm('Cancel this booking? Seats will be freed for others.')) {
      cancelMutation.mutate({ eventId, bookingId });
    }
  };

  if (isLoading) return <div className="loading">Loading your bookings...</div>;
  if (error) return <div className="error">Failed to load bookings</div>;

  const bookings = data?.data || [];

  return (
    <div className="card">
      <h1>My Bookings</h1>
      <p>Cancel a booking to free up seats for others.</p>
      {bookings.length === 0 ? (
        <p>You have no active bookings.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Seats</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.bookingId}>
                <td>{b.eventName}</td>
                <td>{b.seats}</td>
                <td>{new Date(b.date).toLocaleString()}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleCancel(b.eventId, b.bookingId)}
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
  );
}

export default MyBookings;
