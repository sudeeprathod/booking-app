import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (username, password) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Events (public)
export const eventService = {
  getEvents: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  getEvent: async (eventId) => {
    const response = await api.get(`/event/${eventId}`);
    return response.data;
  },

  checkAvailability: async (eventId, seats) => {
    const response = await api.get(`/event/${eventId}/availability`, { params: { seats } });
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/event', eventData);
    return response.data;
  },

  bookSeats: async (eventId, seats) => {
    const response = await api.post(`/event/${eventId}/book`, { seats });
    return response.data;
  },

  cancelBooking: async (eventId, bookingId) => {
    const response = await api.post(`/event/${eventId}/cancel/${bookingId}`);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/user/bookings');
    return response.data;
  },

  getEventBookings: async (eventId) => {
    const response = await api.get(`/event/${eventId}/bookings`);
    return response.data;
  },
};

export default api;
