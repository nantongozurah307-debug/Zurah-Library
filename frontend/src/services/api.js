import axios from 'axios';

// The Flask API runs on localhost:5000. 
// We will configure a proxy in vite.config.js so that /api calls redirect to it, 
// but we fall back to absolute URL to ensure robust direct connections.
const API_URL = import.meta.env.VITE_API_URL || 'https:zurah-library.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('library_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle JWT token expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized (expired token), clear local storage and redirect to login
      const isAuthRoute = 
        window.location.hash.startsWith('#/login') || 
        window.location.hash.startsWith('#/register') || 
        window.location.pathname.startsWith('/login') || 
        window.location.pathname.startsWith('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('library_token');
        localStorage.removeItem('library_user');
        window.location.hash = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
