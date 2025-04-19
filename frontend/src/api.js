import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const apiUrl = "/choreo-apis/awbo/backend/rest-api-be2/v1.0"; // 或者你的 VITE_API_URL

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
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