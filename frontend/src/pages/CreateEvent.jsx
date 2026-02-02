import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { eventService } from '../services/api';

function CreateEvent() {
  const [formData, setFormData] = useState({ name: '', totalSeats: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalSeats' ? (parseInt(value, 10) || '') : value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await eventService.createEvent(formData);
      if (response.success) {
        setSuccess(`Event created! ID: ${response.data.eventId}`);
        setFormData({ name: '', totalSeats: '' });
        queryClient.invalidateQueries('events');
      } else {
        setError('Failed to create event');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1>Create Event (Admin)</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Event Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={200}
          />
        </div>
        <div className="form-group">
          <label htmlFor="totalSeats">Total Seats</label>
          <input
            id="totalSeats"
            name="totalSeats"
            type="number"
            min={1}
            value={formData.totalSeats}
            onChange={handleChange}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}

export default CreateEvent;
