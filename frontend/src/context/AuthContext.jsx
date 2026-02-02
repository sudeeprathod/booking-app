import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'booking_token';
const USER_KEY = 'booking_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem(USER_KEY);
        }
      }
    } else {
      delete api.defaults.headers.common.Authorization;
    }
    setLoading(false);
  }, [token]);

  const login = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
