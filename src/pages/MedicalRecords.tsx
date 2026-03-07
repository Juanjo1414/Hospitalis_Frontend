import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMedicalRecordsByPatient,
  createMedicalRecord,
} from '../services/medical-records.service';
import type {
  MedicalRecord,
  RecordType,
  RecordStatus,
} from '../services/medical-records.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<RecordType, string> = {
  diagnosis:     'Diagnóstico',
  clinical_note: 'Nota Clínica',
  lab_result:    'Resultado de Lab',
  prescription:  'Prescripción',
  procedure:     'Procedimiento',
  vital_signs:   'Signos Vitales',
};

const TYPE_COLORS: Record<RecordType, { bg: string; text: string; border: string }> = {
  diagnosis:     { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  clinical_note: { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  lab_result:    { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  prescription:  { bg: '#fefce8', text: '#ca8a04', border: '#fde047' },
  procedure:     { bg: '#faf5ff', text: '#7c3aed', border: '#c4b5fd' },
  vital_signs:   { bg: '#f0fdfa', text: '#0d9488', border: '#5eead4' },
};

const STATUS_COLORS: Record<RecordStatus, { bg: string; text: string }> = {
  active:   { bg: '#dcfce7', text: '#166534' },
  resolved: { bg: '#f1f5f9', text: '#475569' },
  archived: { bg: '#fef9c3', text: '#854d0e' },
};

const STATUS_LABELS: Record<RecordStatus, string> = {
  active:   'Activo',
  resolved: 'Resuelto',
  archived: 'Archivado',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getDoctorId(): string {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? '';
  } catch {
    return '';
  }
}

// ── Tipos de vista ─────────────────────────────────────────────────────────────
type View = 'history' | 'new_note';

// ── Formulario vacío ───────────────────────────────────────────────────────────
const emptyForm = {
  type: 'clinical_note' as RecordType,
  status: 'active' as RecordStatus,
  title: '',
  description: '',
  icdCode: '',
  notes: '',
  recordDate: new Date().toISOString().split('T')[0],
};

// ── Componente principal ───────────────────────────────────────────────────────
export const MedicalRecords: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [view, setView] = useState<View>('history');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [filterType, setFilterType] = useState<RecordType | ''>('');
  const [filterStatus, setFilterStatus] = useState<RecordStatus | ''>('');

  // Formulario nueva nota
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const LIMIT = 10;

  // ── Cargar historial ─────────────────────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getMedicalRecordsByPatient(patientId, {
        type:   filterType   || undefined,
        status: filterStatus || undefined,
        page,
        limit: LIMIT,
      });
      setRecords(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError('No se pudo cargar el historial médico.');
    } finally {
      setLoading(false);
    }
  }, [patientId, filterType, filterStatus, page]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // ── Guardar nueva nota ────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    if (!form.title.trim() || !form.description.trim()) {
      setSaveError('El título y la descripción son obligatorios.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await createMedicalRecord({
        patientId,
        doctorId: getDoctorId(),
        type:        form.type,
        status:      form.status,
        title:       form.title.trim(),
        description: form.description.trim(),
        icdCode:     form.icdCode.trim() || undefined,
        notes:       form.notes.trim()   || undefined,
        recordDate:  form.recordDate,
      });
      setSaveSuccess(true);
      setForm(emptyForm);
      setView('history');
      setPage(1);
      await loadRecords();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Error al guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  // ── Estilos inline (igual que el resto del proyecto) ─────────────────────────
  const s = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
    },
    // Header
    header: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    backBtn: {
      display: 'flex', alignItems: 'center', gap: '6px',
      background: 'none', border: 'none',
      color: '#64748b', cursor: 'pointer', fontSize: '14px',
      padding: '6px 10px', borderRadius: '6px',
    },
    headerTitle: {
      fontSize: '18px', fontWeight: 700, color: '#0f172a', flex: 1,
    },
    tabBar: {
      display: 'flex', gap: '4px',
    },
    tab: (active: boolean): React.CSSProperties => ({
      padding: '8px 18px', borderRadius: '8px', border: 'none',
      cursor: 'pointer', fontWeight: 600, fontSize: '13px',
      backgroundColor: active ? '#137fec' : 'transparent',
      color: active ? '#ffffff' : '#64748b',
      transition: 'all 0.15s',
    }),
    // Content
    content: { padding: '32px', maxWidth: '900px', margin: '0 auto' },
    // Filters
    filters: {
      display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
    },
    select: {
      padding: '8px 12px', border: '1px solid #e2e8f0',
      borderRadius: '8px', fontSize: '13px', color: '#374151',
      backgroundColor: '#ffffff', cursor: 'pointer',
    },
    // Timeline
    timeline: { display: 'flex', flexDirection: 'column', gap: '16px' },
    // Record card
    card: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex', gap: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    },
    cardLeft: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
      width: '80px', flexShrink: 0,
    },
    cardDate: { fontSize: '11px', color: '#94a3b8', textAlign: 'center' as const },
    cardBody: { flex: 1 },
    cardHeader: {
      display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', gap: '12px', marginBottom: '8px',
    },
    cardTitle: { fontSize: '15px', fontWeight: 700, color: '#0f172a' },
    cardDesc: { fontSize: '13px', color: '#64748b', lineHeight: 1.6 },
    cardIcd: {
      display: 'inline-block', marginTop: '8px',
      padding: '2px 8px', borderRadius: '4px',
      fontSize: '11px', fontWeight: 600,
      backgroundColor: '#f1f5f9', color: '#475569',
    },
    badge: (bg: string, text: string): React.CSSProperties => ({
      display: 'inline-block', padding: '3px 10px',
      borderRadius: '999px', fontSize: '11px', fontWeight: 600,
      backgroundColor: bg, color: text,
    }),
    typeBadge: (type: RecordType): React.CSSProperties => ({
      display: 'inline-block', padding: '3px 10px',
      borderRadius: '999px', fontSize: '11px', fontWeight: 600,
      backgroundColor: TYPE_COLORS[type].bg,
      color: TYPE_COLORS[type].text,
      border: `1px solid ${TYPE_COLORS[type].border}`,
    }),
    // Empty state
    empty: {
      textAlign: 'center' as const, padding: '64px 0',
      color: '#94a3b8', fontSize: '14px',
    },
    emptyIcon: { fontSize: '40px', marginBottom: '12px' },
    // Pagination
    pagination: {
      display: 'flex', justifyContent: 'center',
      gap: '8px', marginTop: '28px',
    },
    pageBtn: (active: boolean): React.CSSProperties => ({
      width: '36px', height: '36px', borderRadius: '8px',
      border: `1px solid ${active ? '#137fec' : '#e2e8f0'}`,
      backgroundColor: active ? '#137fec' : '#ffffff',
      color: active ? '#ffffff' : '#374151',
      cursor: 'pointer', fontWeight: 600, fontSize: '13px',
    }),
    // Form
    form: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    },
    formTitle: { fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
    field: { marginBottom: '16px' },
    label: {
      display: 'block', fontSize: '13px',
      fontWeight: 600, color: '#374151', marginBottom: '6px',
    },
    input: {
      width: '100%', padding: '10px 12px',
      border: '1px solid #e2e8f0', borderRadius: '8px',
      fontSize: '13px', color: '#0f172a',
      outline: 'none', boxSizing: 'border-box' as const,
    },
    textarea: {
      width: '100%', padding: '10px 12px',
      border: '1px solid #e2e8f0', borderRadius: '8px',
      fontSize: '13px', color: '#0f172a', resize: 'vertical' as const,
      outline: 'none', boxSizing: 'border-box' as const, minHeight: '90px',
    },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
    btnPrimary: {
      padding: '10px 24px', borderRadius: '8px', border: 'none',
      backgroundColor: '#137fec', color: '#ffffff',
      fontWeight: 600, fontSize: '14px', cursor: 'pointer',
    },
    btnSecondary: {
      padding: '10px 24px', borderRadius: '8px',
      border: '1px solid #e2e8f0', backgroundColor: '#ffffff',
      color: '#374151', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
    },
    errorBox: {
      backgroundColor: '#fef2f2', border: '1px solid #fca5a5',
      borderRadius: '8px', padding: '12px 16px',
      color: '#dc2626', fontSize: '13px', marginBottom: '16px',
    },
    successBox: {
      backgroundColor: '#f0fdf4', border: '1px solid #86efac',
      borderRadius: '8px', padding: '12px 16px',
      color: '#16a34a', fontSize: '13px', marginBottom: '16px',
    },
    dot: {
      width: '10px', height: '10px', borderRadius: '50%',
      backgroundColor: '#137fec', flexShrink: 0,
    },
    line: {
      width: '2px', flex: 1, backgroundColor: '#e2e8f0',
      minHeight: '20px',
    },
  } satisfies Record<string, React.CSSProperties | ((...args: any[]) => React.CSSProperties)>;

  const totalPages = Math.ceil(total / LIMIT);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/patients')}>
          ← Pacientes
        </button>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span style={s.headerTitle}>📋 Historial Médico</span>
        <div style={s.tabBar}>
          <button style={s.tab(view === 'history')} onClick={() => setView('history')}>
            Historial
          </button>
          <button style={s.tab(view === 'new_note')} onClick={() => { setView('new_note'); setSaveSuccess(false); setSaveError(''); }}>
            + Nueva Nota
          </button>
        </div>
      </div>

      <div style={s.content}>

        {/* ── VISTA: Historial ── */}
        {view === 'history' && (
          <>
            {/* Filtros */}
            <div style={s.filters}>
              <select
                style={s.select}
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value as RecordType | ''); setPage(1); }}
              >
                <option value="">Todos los tipos</option>
                {(Object.keys(TYPE_LABELS) as RecordType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              <select
                style={s.select}
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value as RecordStatus | ''); setPage(1); }}
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="resolved">Resuelto</option>
                <option value="archived">Archivado</option>
              </select>
              {(filterType || filterStatus) && (
                <button
                  style={{ ...s.select, color: '#ef4444', cursor: 'pointer' }}
                  onClick={() => { setFilterType(''); setFilterStatus(''); setPage(1); }}
                >
                  ✕ Limpiar filtros
                </button>
              )}
            </div>

            {/* Estado de carga / error */}
            {loading && (
              <div style={s.empty}>
                <div style={s.emptyIcon}>⏳</div>
                Cargando historial...
              </div>
            )}
            {!loading && error && <div style={s.errorBox}>{error}</div>}

            {/* Timeline */}
            {!loading && !error && records.length === 0 && (
              <div style={s.empty}>
                <div style={s.emptyIcon}>📂</div>
                No hay registros clínicos para este paciente.
                <br />
                <button
                  style={{ ...s.btnPrimary, marginTop: '16px' }}
                  onClick={() => setView('new_note')}
                >
                  + Crear primer registro
                </button>
              </div>
            )}

            {!loading && records.length > 0 && (
              <div style={s.timeline}>
                {records.map((rec, idx) => (
                  <div key={rec._id} style={{ display: 'flex', gap: '16px' }}>
                    {/* Línea de tiempo */}
                    <div style={s.cardLeft}>
                      <div style={s.dot} />
                      {idx < records.length - 1 && <div style={s.line} />}
                      <span style={s.cardDate}>{formatDate(rec.recordDate)}</span>
                    </div>

                    {/* Tarjeta */}
                    <div style={{ ...s.card, flex: 1 }}>
                      <div style={s.cardBody}>
                        <div style={s.cardHeader}>
                          <span style={s.cardTitle}>{rec.title}</span>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <span style={s.typeBadge(rec.type)}>{TYPE_LABELS[rec.type]}</span>
                            <span style={s.badge(STATUS_COLORS[rec.status].bg, STATUS_COLORS[rec.status].text)}>
                              {STATUS_LABELS[rec.status]}
                            </span>
                          </div>
                        </div>
                        <p style={s.cardDesc}>{rec.description}</p>
                        {rec.icdCode && (
                          <span style={s.cardIcd}>ICD-10: {rec.icdCode}</span>
                        )}
                        {rec.notes && (
                          <p style={{ ...s.cardDesc, marginTop: '8px', fontStyle: 'italic' }}>
                            📝 {rec.notes}
                          </p>
                        )}
                        {/* Vitales */}
                        {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {rec.vitals.heartRate && (
                              <span style={{ ...s.cardIcd, backgroundColor: '#fef2f2', color: '#dc2626' }}>
                                ❤️ {rec.vitals.heartRate} bpm
                              </span>
                            )}
                            {rec.vitals.bloodPressure && (
                              <span style={{ ...s.cardIcd, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                                🩺 {rec.vitals.bloodPressure} mmHg
                              </span>
                            )}
                            {rec.vitals.temperature && (
                              <span style={{ ...s.cardIcd, backgroundColor: '#fefce8', color: '#ca8a04' }}>
                                🌡️ {rec.vitals.temperature}°C
                              </span>
                            )}
                            {rec.vitals.oxygenSaturation && (
                              <span style={{ ...s.cardIcd, backgroundColor: '#f0fdfa', color: '#0d9488' }}>
                                💨 {rec.vitals.oxygenSaturation}% SpO2
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={s.pagination}>
                <button
                  style={s.pageBtn(false)}
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} style={s.pageBtn(p === page)} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button
                  style={s.pageBtn(false)}
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}

        {/* ── VISTA: Nueva Nota Clínica ── */}
        {view === 'new_note' && (
          <div style={s.form}>
            <div style={s.formTitle}>📝 Registrar Nota Clínica</div>

            {saveError  && <div style={s.errorBox}>⚠️ {saveError}</div>}
            {saveSuccess && <div style={s.successBox}>✅ Registro guardado correctamente.</div>}

            <form onSubmit={handleSave}>
              {/* Tipo + Estado */}
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Tipo de registro *</label>
                  <select
                    style={{ ...s.input }}
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value as RecordType }))}
                    required
                  >
                    {(Object.keys(TYPE_LABELS) as RecordType[]).map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Estado *</label>
                  <select
                    style={{ ...s.input }}
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as RecordStatus }))}
                    required
                  >
                    <option value="active">Activo</option>
                    <option value="resolved">Resuelto</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
              </div>

              {/* Título + Fecha */}
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Título *</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Ej: Consulta de control — Diabetes"
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={s.label}>Fecha del registro *</label>
                  <input
                    style={s.input}
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={form.recordDate}
                    onChange={(e) => setForm(f => ({ ...f, recordDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Descripción */}
              <div style={s.field}>
                <label style={s.label}>Descripción *</label>
                <textarea
                  style={s.textarea}
                  placeholder="Descripción clínica detallada del registro..."
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>

              {/* ICD-10 + Notas */}
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Código ICD-10 <span style={{ color: '#94a3b8' }}>(opcional)</span></label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Ej: E11.9"
                    value={form.icdCode}
                    onChange={(e) => setForm(f => ({ ...f, icdCode: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={s.label}>Notas adicionales <span style={{ color: '#94a3b8' }}>(opcional)</span></label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Observaciones del médico..."
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>

              {/* Acciones */}
              <div style={s.actions}>
                <button
                  type="button"
                  style={s.btnSecondary}
                  onClick={() => { setView('history'); setSaveError(''); setForm(emptyForm); }}
                >
                  Cancelar
                </button>
                <button type="submit" style={s.btnPrimary} disabled={saving}>
                  {saving ? 'Guardando...' : '💾 Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default MedicalRecords;