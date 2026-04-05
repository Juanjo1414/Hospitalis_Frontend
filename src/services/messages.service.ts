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

export const getInbox = () => API.get('/messages/inbox');
export const getConversation = (userId: string) => API.get(`/messages/conversation/${userId}`);
export const sendMessage = (receiverId: string, content: string) => API.post('/messages', { receiverId, content });
export const markAsRead = (messageId: string) => API.patch(`/messages/${messageId}/read`);
export const getUnreadCount = () => API.get('/messages/unread-count');
