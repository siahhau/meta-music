import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

// 添加请求拦截器以附加 JWT 令牌
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || '有些地方好像错了')
);

// ----------------------------------------------------------------------

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban/',
  calendar: '/api/calendar',
  auth: {
    me: '/api/user/me/',
    signIn: '/api/token/',
    signUp: '/api/user/register/',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  user: {
    list: '/api/user/list',
    details: '/api/user/:pk/',
    permission: '/api/user/:pk/permission',
    update: '/api/user/:pk/update',
  },
  track: {
    list: '/api/track/list/',
    details: '/api/track/:spotify_id/',
    search: '/api/track/search/',
  },
  album: {
    details: '/api/album/:spotify_id/',
  },
  score: {
    create: '/api/score/create/',
    list: '/api/score/list/',
    details: '/api/score/:pk/',
    update: '/api/score/:pk/update/',
    review: '/api/score/review/',
    review_update: '/api/score/:pk/review/',
    mark_paid: '/api/score/:pk/mark-paid/',
    stats: '/api/score/stats/',
  },
};
