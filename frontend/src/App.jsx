import React from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import EventsList from './pages/EventsList';
import EventBook from './pages/EventBook';
import MyBookings from './pages/MyBookings';
import CreateEvent from './pages/CreateEvent';

function AppContent() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="container">
      <nav className="nav">
        <NavLink to="/events" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Events
        </NavLink>
        <NavLink to="/my-bookings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          My Bookings
        </NavLink>
        {isAdmin && (
          <NavLink to="/create-event" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Create Event
          </NavLink>
        )}
        <span className="nav-user" style={{float: 'right'}}>
          {user?.username}
          {user?.role === 'admin' && ' (Admin)'}
          <button type="button" className="btn btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </span>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/:eventId/book" element={<EventBook />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/create-event" element={<CreateEvent />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={(
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}

export default App;
