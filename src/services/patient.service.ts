import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});

// Interceptor: añade el JWT a cada request automáticamente
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Tipos ────────────────────────────────────────────────────
export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  notes?: string;
  status: 'active' | 'inactive' | 'inpatient' | 'discharged';
  createdAt?: string;
}

export interface PatientsResponse {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  notes?: string;
  status?: string;
}

// ── API calls ────────────────────────────────────────────────
export const getPatients = (params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => API.get<PatientsResponse>('/patients', { params });

export const getPatient = (id: string) =>
  API.get<Patient>(`/patients/${id}`);

export const createPatient = (data: CreatePatientData) =>
  API.post<Patient>('/patients', data);

export const updatePatient = (id: string, data: Partial<CreatePatientData>) =>
  API.patch<Patient>(`/patients/${id}`, data);

export const deletePatient = (id: string) =>
  API.delete(`/patients/${id}`);