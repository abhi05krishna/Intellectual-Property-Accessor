import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';
import { clearAuth } from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('originai_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token and hydrate user on mount
  useEffect(() => {
    const token = localStorage.getItem('originai_token');
    if (!token) { setLoading(false); return; }

    authAPI.getMe()
      .then(({ data }) => {
        setUser(data.data.user);
        localStorage.setItem('originai_user', JSON.stringify(data.data.user));
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('originai_token', data.token);
    localStorage.setItem('originai_refresh', data.refreshToken);
    localStorage.setItem('originai_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    toast.success(`Welcome back, ${data.data.user.name.split(' ')[0]}!`);
    return data.data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('originai_token', data.token);
    localStorage.setItem('originai_refresh', data.refreshToken);
    localStorage.setItem('originai_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
    toast.success('Account created successfully!');
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    clearAuth();
    setUser(null);
    toast.success('Logged out');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('originai_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
