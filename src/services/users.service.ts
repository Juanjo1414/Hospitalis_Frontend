import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const updateProfile = (id: string, data: any) => API.patch(`/users/${id}`, data);
export const getProfileInfo = (id: string) => API.get(`/users/${id}`);
export const getUsers = () => API.get('/users');
