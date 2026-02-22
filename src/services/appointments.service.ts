import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Tipos ────────────────────────────────────────────────────
export interface Appointment {
  _id: string;
  patientId: { _id: string; firstName: string; lastName: string; email?: string; phone?: string };
  doctorId:  { _id: string; fullname: string; specialty?: string };
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
  room?: string;
  createdAt?: string;
}

export interface AppointmentsResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  type?: string;
  status?: string;
  reason: string;
  notes?: string;
  room?: string;
}

// ── API calls ────────────────────────────────────────────────
export const getAppointments = (params?: {
  doctorId?: string;
  patientId?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}) => API.get<AppointmentsResponse>('/appointments', { params });

export const getTodayAppointments = () =>
  API.get<Appointment[]>('/appointments/today');

export const getAppointment = (id: string) =>
  API.get<Appointment>(`/appointments/${id}`);

export const createAppointment = (data: CreateAppointmentData) =>
  API.post<Appointment>('/appointments', data);

export const updateAppointment = (id: string, data: Partial<CreateAppointmentData> & { status?: string; notes?: string }) =>
  API.patch<Appointment>(`/appointments/${id}`, data);

export const deleteAppointment = (id: string) =>
  API.delete(`/appointments/${id}`);