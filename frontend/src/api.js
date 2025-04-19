import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

api.interceptors.request.use(
  (config) => {
    // 定义不需要 token 的公共路径
    const publicPaths = ['/api/token/', '/api/user/register/']; // 登录和注册路径

    // 检查当前请求的 URL 是否是公共路径
    if (!publicPaths.includes(config.url)) {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;