import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// 创建 axios 实例
const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    withCredentials: true
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // token 过期或无效，清除本地存储并重定向到登录页
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance; 