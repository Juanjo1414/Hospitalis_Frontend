import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});

// Interceptor: agrega JWT en cada request automáticamente
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type RecordType =
  | 'diagnosis'
  | 'clinical_note'
  | 'lab_result'
  | 'prescription'
  | 'procedure'
  | 'vital_signs';

export type RecordStatus = 'active' | 'resolved' | 'archived';

export interface MedicalRecord {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  type: RecordType;
  status: RecordStatus;
  title: string;
  description: string;
  icdCode?: string;
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
  };
  labResult?: {
    testName?: string;
    result?: string;
    unit?: string;
    referenceRange?: string;
  };
  attachments?: string[];
  recordDate: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordDto {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  type: RecordType;
  status?: RecordStatus;
  title: string;
  description: string;
  icdCode?: string;
  vitals?: MedicalRecord['vitals'];
  labResult?: MedicalRecord['labResult'];
  recordDate?: string;
  notes?: string;
  tags?: string[];
}

export interface MedicalRecordFilters {
  type?: RecordType;
  status?: RecordStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedRecords {
  data: MedicalRecord[];
  total: number;
  page: number;
  limit: number;
}

// ── Funciones API ──────────────────────────────────────────────────────────────

export const createMedicalRecord = (dto: CreateMedicalRecordDto) =>
  API.post<MedicalRecord>('/medical-records', dto);

export const getMedicalRecordsByPatient = (
  patientId: string,
  filters?: MedicalRecordFilters,
) => {
  const params = new URLSearchParams();
  if (filters?.type)   params.append('type',   filters.type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.from)   params.append('from',   filters.from);
  if (filters?.to)     params.append('to',     filters.to);
  if (filters?.page)   params.append('page',   String(filters.page));
  if (filters?.limit)  params.append('limit',  String(filters.limit));
  return API.get<PaginatedRecords>(`/medical-records/patient/${patientId}?${params.toString()}`);
};

export const getMedicalRecordsSummary = (patientId: string) =>
  API.get(`/medical-records/patient/${patientId}/summary`);

export const getMedicalRecordById = (id: string) =>
  API.get<MedicalRecord>(`/medical-records/${id}`);

export const updateMedicalRecord = (id: string, dto: Partial<CreateMedicalRecordDto>) =>
  API.patch<MedicalRecord>(`/medical-records/${id}`, dto);

export const deleteMedicalRecord = (id: string) =>
  API.delete(`/medical-records/${id}`);