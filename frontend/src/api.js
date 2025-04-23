// frontend/src/api.js
import axios from 'axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://119.27.184.159',
});

api.interceptors.request.use(
  (config) => {
    const publicPaths = ['/api/token/', '/api/user/register/'];
    if (!publicPaths.includes(config.url)) {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://119.27.184.159'}/api/token/refresh/`,
          { refresh: refreshToken }
        );
        const newAccessToken = response.data.access;
        localStorage.setItem(ACCESS_TOKEN, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;