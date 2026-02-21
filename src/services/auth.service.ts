import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});

export const registerUser = (data: {
  fullName: string;
  email: string;
  password: string;
  specialty?: string; 
}) => API.post('/auth/register', data);

export const loginUser = (data: {
  email: string;
  password: string;
}) => API.post('/auth/login', data);

export const forgotPassword = (email: string) =>
  API.post('/auth/forgot-password', { email });
