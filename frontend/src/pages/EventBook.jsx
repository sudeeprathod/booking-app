import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { eventService } from '../services/api';

function EventBook() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const { data: eventData, isLoading } = useQuery(
    ['event', eventId],
    () => eventService.getEvent(eventId),
    { enabled: !!eventId }
  );

  const bookMutation = useMutation(
    () => eventService.bookSeats(eventId, seats),
    {
      onSuccess: (res) => {
        if (res.success) {
          setSuccess(`Booked ${res.data.seatsBooked} seat(s). Remaining: ${res.data.remainingSeats}`);
          queryClient.invalidateQueries(['event', eventId]);
          queryClient.invalidateQueries('events');
          queryClient.invalidateQueries('myBookings');
        }
      },
      onError: (err) => {
        setError(err.response?.data?.message || 'Booking failed');
      },
    }
  );

  const event = eventData?.data;
  const soldOut = event?.soldOut || event?.availableSeats === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (soldOut) return;
    if (seats < 1 || seats > (event?.availableSeats ?? 0)) {
      setError(`Enter 1–${event?.availableSeats ?? 0} seats`);
      return;
    }
    bookMutation.mutate();
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (!event) return <div className="error">Event not found</div>;

  return (
    <div className="card">
      <h1>{event.name}</h1>
      <p>Total seats: {event.totalSeats} | Available: {event.availableSeats}</p>
      {soldOut ? (
        <p className="badge badge-danger">Sold Out</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="seats">Number of seats</label>
            <input
              id="seats"
              type="number"
              min={1}
              max={event.availableSeats}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <button type="submit" className="btn btn-primary" disabled={bookMutation.isLoading}>
            {bookMutation.isLoading ? 'Booking...' : 'Book'}
          </button>
        </form>
      )}
      <p style={{ marginTop: '16px' }}>
        <button type="button" className="btn" onClick={() => navigate('/events')}>
          Back to events
        </button>
      </p>
    </div>
  );
}

export default EventBook;
