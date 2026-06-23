import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('library_token');
      const savedUser = localStorage.getItem('library_user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          
          // Verify token with backend
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('library_user', JSON.stringify(res.data.user));
        } catch (error) {
          console.error("Auth initialization failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (usernameOrEmail, password) => {
    try {
      const res = await api.post('/auth/login', {
        username_or_email: usernameOrEmail,
        password: password,
      });
      const { token, user: loggedUser } = res.data;
      
      localStorage.setItem('library_token', token);
      localStorage.setItem('library_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Invalid credentials or connection error.';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (username, email, password, role = 'member') => {
    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
        role,
      });
      const { token, user: loggedUser } = res.data;
      
      localStorage.setItem('library_token', token);
      localStorage.setItem('library_user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'librarian',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
