import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('gate_token');
    const savedUser = localStorage.getItem('gate_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        fetchMe();
      } catch {
        logout();
      }
    }
    setLoading(false);
    setInitialized(true);
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('gate_user', JSON.stringify(data.user));
    } catch {
      // token expired
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('gate_token', data.token);
    localStorage.setItem('gate_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}! 🎓`);
    return data.user;
  };

  const signup = async (name, email, password, level) => {
    const { data } = await api.post('/auth/signup', { name, email, password, level });
    localStorage.setItem('gate_token', data.token);
    localStorage.setItem('gate_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome to GATE EEE, ${data.user.name}! ⚡`);
    return data.user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('gate_token');
    localStorage.removeItem('gate_user');
    setUser(null);
    toast('Logged out successfully', { icon: '👋' });
  }, []);

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('gate_user', JSON.stringify(updated));
  };

  const completeOnboarding = async (data) => {
    const res = await api.put('/auth/onboarding', data);
    updateUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, initialized,
      login, signup, logout,
      updateUser, fetchMe, completeOnboarding,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
