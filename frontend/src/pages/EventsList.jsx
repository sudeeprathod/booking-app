import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { eventService } from '../services/api';

function EventsList() {
  const { data, isLoading, error } = useQuery('events', eventService.getEvents);

  if (isLoading) return <div className="loading">Loading events...</div>;
  if (error) return <div className="error">Failed to load events</div>;

  const events = data?.data || [];

  return (
    <div className="card">
      <h1>All Events</h1>
      <p>Pick an event to book tickets based on availability.</p>
      {events.length === 0 ? (
        <p>No events yet. Admin can create events.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Total Seats</th>
              <th>Available</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.eventId}>
                <td>{event.name}</td>
                <td>{event.totalSeats}</td>
                <td>{event.availableSeats}</td>
                <td>
                  {event.soldOut ? (
                    <span className="badge badge-danger">Sold Out</span>
                  ) : (
                    <span className="badge badge-success">Available</span>
                  )}
                </td>
                <td>
                  {event.soldOut ? (
                    <span>—</span>
                  ) : (
                    <Link to={`/events/${event.eventId}/book`} className="btn btn-primary btn-sm">
                      Book
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EventsList;
