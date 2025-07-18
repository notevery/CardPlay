import { API_BASE_URL } from '../config/api';
import axiosInstance from './axios';

export interface UserInfo {
  id: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, {
    username,
    password
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<UserInfo> => {
  const response = await axiosInstance.get<UserInfo>(`${API_BASE_URL}/api/auth/me`);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  delete axiosInstance.defaults.headers.common['Authorization'];
}; 