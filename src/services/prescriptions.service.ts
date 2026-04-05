import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Prescription {
  _id: string;
  patientId:     { _id: string; firstName: string; lastName: string } | string;
  appointmentId: { _id: string; date: string; startTime: string } | string | null;
  doctorId:      { _id: string; fullname: string; email: string } | string;
  medication:    string;
  dosage:        number;
  unit:          string;
  frequency:     string;
  duration:      string;
  route:         string;
  instructions:  string;
  status:        'active' | 'expired' | 'cancelled';
  createdAt:     string;
}

export interface PrescriptionListResponse {
  data:  Prescription[];
  total: number;
  page:  number;
  limit: number;
}

export const getPrescriptions = (params?: Record<string, any>) =>
  API.get<PrescriptionListResponse>('/prescriptions', { params });

export const getPrescription = (id: string) =>
  API.get<Prescription>(`/prescriptions/${id}`);

export const createPrescription = (data: Partial<Prescription>) =>
  API.post<Prescription>('/prescriptions', data);

export const updatePrescription = (id: string, data: Partial<Prescription>) =>
  API.patch<Prescription>(`/prescriptions/${id}`, data);

export const deletePrescription = (id: string) =>
  API.delete(`/prescriptions/${id}`);