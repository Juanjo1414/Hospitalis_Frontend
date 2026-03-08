import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMedicalRecordsByPatient,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
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

const C = {
  primary: '#137fec', white: '#ffffff',
  bg: '#f8fafc', border: '#e2e8f0',
  text: '#0f172a', sub: '#64748b', muted: '#94a3b8',
  red: '#dc2626', redBg: '#fef2f2',
  green: '#16a34a', greenBg: '#f0fdf4',
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
    const base64  = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    const jsonStr = decodeURIComponent(Array.from(atob(base64)).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
    return JSON.parse(jsonStr).sub ?? '';
  } catch { return ''; }
}

function getDoctorRole(): string {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return '';
    const base64  = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    const jsonStr = decodeURIComponent(Array.from(atob(base64)).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
    return JSON.parse(jsonStr).role ?? '';
  } catch { return ''; }
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
type View = 'history' | 'new_note' | 'edit';

const emptyForm = {
  type:        'clinical_note' as RecordType,
  status:      'active'        as RecordStatus,
  title:       '',
  description: '',
  icdCode:     '',
  notes:       '',
  recordDate:  new Date().toISOString().split('T')[0],
};

// ── Estilos base ──────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: `1px solid ${C.border}`, borderRadius: '8px',
  fontSize: '13px', color: C.text,
  outline: 'none', boxSizing: 'border-box',
};
const btnP: React.CSSProperties = {
  padding: '10px 24px', borderRadius: '8px', border: 'none',
  backgroundColor: C.primary, color: C.white,
  fontWeight: 600, fontSize: '14px', cursor: 'pointer',
};
const btnG: React.CSSProperties = {
  padding: '10px 24px', borderRadius: '8px',
  border: `1px solid ${C.border}`, backgroundColor: C.white,
  color: '#374151', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
};

// ── Componente ────────────────────────────────────────────────────────────────
export const MedicalRecords: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate      = useNavigate();

  const [view,         setView]         = useState<View>('history');
  const [records,      setRecords]      = useState<MedicalRecord[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [filterType,   setFilterType]   = useState<RecordType | ''>('');
  const [filterStatus, setFilterStatus] = useState<RecordStatus | ''>('');
  const [form,         setForm]         = useState(emptyForm);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [saveSuccess,  setSaveSuccess]  = useState(false);

  const LIMIT   = 10;
  const isAdmin = getDoctorRole() === 'admin';

  const loadRecords = useCallback(async () => {
    if (!patientId || patientId === 'undefined') return;
    setLoading(true); setError('');
    try {
      const res = await getMedicalRecordsByPatient(patientId, {
        type:   filterType   || undefined,
        status: filterStatus || undefined,
        page, limit: LIMIT,
      });
      setRecords(res.data.data  ?? []);
      setTotal(res.data.total   ?? 0);
    } catch {
      setError('No se pudo cargar el historial médico.');
    } finally {
      setLoading(false);
    }
  }, [patientId, filterType, filterStatus, page]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    if (!form.title.trim() || !form.description.trim()) {
      setSaveError('El título y la descripción son obligatorios.');
      return;
    }
    setSaving(true); setSaveError(''); setSaveSuccess(false);
    try {
      if (view === 'edit' && editingId) {
        await updateMedicalRecord(editingId, {
          type: form.type, status: form.status,
          title: form.title.trim(), description: form.description.trim(),
          icdCode:    form.icdCode.trim()  || undefined,
          notes:      form.notes.trim()    || undefined,
          recordDate: form.recordDate,
        });
      } else {
        await createMedicalRecord({
          patientId, doctorId: getDoctorId(),
          type: form.type, status: form.status,
          title: form.title.trim(), description: form.description.trim(),
          icdCode:    form.icdCode.trim()  || undefined,
          notes:      form.notes.trim()    || undefined,
          recordDate: form.recordDate,
        });
      }
      setSaveSuccess(true);
      setForm(emptyForm); setEditingId(null);
      setView('history'); setPage(1);
      await loadRecords();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Error al guardar el registro.');
    } finally { setSaving(false); }
  };

  const openEdit = (rec: MedicalRecord) => {
    setEditingId(rec._id);
    setForm({
      type: rec.type, status: rec.status,
      title: rec.title, description: rec.description,
      icdCode: rec.icdCode ?? '', notes: rec.notes ?? '',
      recordDate: rec.recordDate.split('T')[0],
    });
    setSaveError(''); setSaveSuccess(false);
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    try {
      await deleteMedicalRecord(id);
      await loadRecords();
    } catch (err: any) {
      if (err?.response?.status === 403) alert('Solo los administradores pueden eliminar registros médicos.');
      else alert(err?.response?.data?.message || 'Error al eliminar el registro.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
      {children}
    </label>
  );

  const css = `
    .mr-header { background:${C.white}; border-bottom:1px solid ${C.border}; padding:14px 32px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .mr-nav-tabs { display:flex; gap:4px; flex-shrink:0; }
    .mr-body { padding:32px; max-width:900px; margin:0 auto; }
    .mr-filters { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
    .mr-form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .mr-timeline-item { display:flex; gap:16px; }
    .mr-timeline-dot { display:flex; flex-direction:column; align-items:center; gap:6px; width:80px; flex-shrink:0; }
    .mr-card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:8px; flex-wrap:wrap; }
    .mr-card-actions { display:flex; gap:8px; align-items:center; flex-shrink:0; flex-wrap:wrap; }

    @media (max-width:768px) {
      .mr-header { padding:12px 16px; }
      .mr-body { padding:16px; }
      .mr-filters { flex-direction:column; }
      .mr-form-grid-2 { grid-template-columns:1fr; }
      .mr-timeline-dot { width:40px; }
      .mr-timeline-dot span { display:none; }
      .mr-card-header { flex-direction:column; }
      .mr-card-actions { flex-direction:row; flex-wrap:wrap; }
    }
    @media (max-width:480px) {
      .mr-nav-tabs button { padding:6px 10px !important; font-size:12px !important; }
      .mr-header { gap:8px; }
    }
  `;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <style>{css}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mr-header">
        <button
          style={{ background: 'none', border: 'none', color: C.sub, cursor: 'pointer', fontSize: '14px', padding: '6px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}
          onClick={() => navigate('/patients')}
        >
          ← Pacientes
        </button>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span style={{ fontSize: '16px', fontWeight: 700, color: C.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📋 Historial Médico
        </span>

        <div className="mr-nav-tabs">
          {(['history', 'new_note'] as const).map((v) => (
            <button key={v} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px',
              backgroundColor: view === v ? C.primary : 'transparent',
              color:           view === v ? C.white  : C.sub,
            }}
              onClick={() => {
                if (v === 'new_note') { setForm(emptyForm); setEditingId(null); setSaveError(''); setSaveSuccess(false); }
                setView(v);
              }}
            >
              {v === 'history' ? 'Historial' : '+ Nueva Nota'}
            </button>
          ))}
          {view === 'edit' && (
            <button style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'default', fontWeight: 600, fontSize: '13px', backgroundColor: C.primary, color: C.white }}>
              ✏️ Editando
            </button>
          )}
        </div>
      </div>

      <div className="mr-body">

        {/* ══════════════════════════════════════════════════════════
            VISTA: Historial
        ══════════════════════════════════════════════════════════ */}
        {view === 'history' && (
          <>
            {/* Filtros */}
            <div className="mr-filters">
              <select style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', backgroundColor: C.white, cursor: 'pointer' }}
                value={filterType} onChange={(e) => { setFilterType(e.target.value as RecordType | ''); setPage(1); }}>
                <option value="">Todos los tipos</option>
                {(Object.keys(TYPE_LABELS) as RecordType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
              <select style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', backgroundColor: C.white, cursor: 'pointer' }}
                value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as RecordStatus | ''); setPage(1); }}>
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="resolved">Resuelto</option>
                <option value="archived">Archivado</option>
              </select>
              {(filterType || filterStatus) && (
                <button style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '13px', backgroundColor: C.white, color: C.red, cursor: 'pointer' }}
                  onClick={() => { setFilterType(''); setFilterStatus(''); setPage(1); }}>
                  ✕ Limpiar
                </button>
              )}
            </div>

            {/* Cargando */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: C.muted, fontSize: '14px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
                Cargando historial...
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{ backgroundColor: C.redBg, border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: C.red, fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {/* Sin registros */}
            {!loading && !error && records.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: C.muted, fontSize: '14px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📂</div>
                No hay registros clínicos para este paciente.
                <br />
                <button style={{ ...btnP, marginTop: '16px' }} onClick={() => setView('new_note')}>
                  + Crear primer registro
                </button>
              </div>
            )}

            {/* Timeline */}
            {!loading && records.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {records.map((rec, idx) => (
                  <div key={rec._id} className="mr-timeline-item">

                    {/* Indicador */}
                    <div className="mr-timeline-dot">
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: C.primary, flexShrink: 0 }} />
                      {idx < records.length - 1 && <div style={{ width: '2px', flex: 1, backgroundColor: C.border, minHeight: '20px' }} />}
                      <span style={{ fontSize: '11px', color: C.muted, textAlign: 'center' }}>{formatDate(rec.recordDate)}</span>
                    </div>

                    {/* Tarjeta */}
                    <div style={{ flex: 1, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', minWidth: 0 }}>

                      <div className="mr-card-header">
                        <span style={{ fontSize: '15px', fontWeight: 700, color: C.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.title}</span>

                        <div className="mr-card-actions">
                          {/* Fecha visible en móvil */}
                          <span style={{ fontSize: '11px', color: C.muted, display: 'none' }} className="mr-date-mobile">{formatDate(rec.recordDate)}</span>

                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, backgroundColor: TYPE_COLORS[rec.type].bg, color: TYPE_COLORS[rec.type].text, border: `1px solid ${TYPE_COLORS[rec.type].border}` }}>
                            {TYPE_LABELS[rec.type]}
                          </span>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, backgroundColor: STATUS_COLORS[rec.status].bg, color: STATUS_COLORS[rec.status].text }}>
                            {STATUS_LABELS[rec.status]}
                          </span>
                          <button
                            style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#eff6ff', color: C.primary, fontWeight: 600, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onClick={() => openEdit(rec)}
                          >
                            ✏️ Editar
                          </button>
                          {isAdmin && (
                            <button
                              style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', backgroundColor: C.redBg, color: C.red, fontWeight: 600, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                              onClick={() => handleDelete(rec._id)}
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: C.sub, lineHeight: 1.6, margin: '0 0 8px' }}>{rec.description}</p>

                      {rec.icdCode && (
                        <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569' }}>
                          ICD-10: {rec.icdCode}
                        </span>
                      )}

                      {rec.notes && (
                        <p style={{ fontSize: '13px', color: C.sub, marginTop: '8px', fontStyle: 'italic', lineHeight: 1.6 }}>
                          📝 {rec.notes}
                        </p>
                      )}

                      {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                          {rec.vitals.heartRate        && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#fef2f2', color: C.red }}>❤️ {rec.vitals.heartRate} bpm</span>}
                          {rec.vitals.bloodPressure    && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#eff6ff', color: '#2563eb' }}>🩺 {rec.vitals.bloodPressure} mmHg</span>}
                          {rec.vitals.temperature      && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#fefce8', color: '#ca8a04' }}>🌡️ {rec.vitals.temperature}°C</span>}
                          {rec.vitals.oxygenSaturation && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#f0fdfa', color: '#0d9488' }}>💨 {rec.vitals.oxygenSaturation}% SpO2</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px', flexWrap: 'wrap' }}>
                <button style={{ ...btnG, padding: '8px 14px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p}
                    style={{ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${p === page ? C.primary : C.border}`, backgroundColor: p === page ? C.primary : C.white, color: p === page ? C.white : '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                    onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button style={{ ...btnG, padding: '8px 14px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            VISTA: Formulario (nueva nota o edición)
        ══════════════════════════════════════════════════════════ */}
        {(view === 'new_note' || view === 'edit') && (
          <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '24px' }}>
              {view === 'edit' ? '✏️ Editar Registro Clínico' : '📝 Registrar Nota Clínica'}
            </div>

            {saveError   && <div style={{ backgroundColor: C.redBg, border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: C.red, fontSize: '13px', marginBottom: '16px' }}>⚠️ {saveError}</div>}
            {saveSuccess && <div style={{ backgroundColor: C.greenBg, border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', color: C.green, fontSize: '13px', marginBottom: '16px' }}>✅ Registro guardado correctamente.</div>}

            <form onSubmit={handleSave}>
              {/* Tipo + Estado */}
              <div className="mr-form-grid-2">
                <div>
                  <Lbl>Tipo de registro *</Lbl>
                  <select style={inp} value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as RecordType }))} required>
                    {(Object.keys(TYPE_LABELS) as RecordType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <Lbl>Estado *</Lbl>
                  <select style={inp} value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as RecordStatus }))} required>
                    <option value="active">Activo</option>
                    <option value="resolved">Resuelto</option>
                    <option value="archived">Archivado</option>
                  </select>
                </div>
              </div>

              {/* Título + Fecha */}
              <div className="mr-form-grid-2">
                <div>
                  <Lbl>Título *</Lbl>
                  <input style={inp} type="text" placeholder="Ej: Consulta de control — Diabetes"
                    value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div>
                  <Lbl>Fecha del registro *</Lbl>
                  <input style={inp} type="date" max={new Date().toISOString().split('T')[0]}
                    value={form.recordDate} onChange={(e) => setForm(f => ({ ...f, recordDate: e.target.value }))} required />
                </div>
              </div>

              {/* Descripción */}
              <div style={{ marginBottom: '16px' }}>
                <Lbl>Descripción *</Lbl>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: '90px' }}
                  placeholder="Descripción clínica detallada del registro..."
                  value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>

              {/* ICD-10 + Notas */}
              <div className="mr-form-grid-2">
                <div>
                  <Lbl>Código ICD-10 <span style={{ color: C.muted, fontWeight: 400 }}>(opcional)</span></Lbl>
                  <input style={inp} type="text" placeholder="Ej: E11.9"
                    value={form.icdCode} onChange={(e) => setForm(f => ({ ...f, icdCode: e.target.value }))} />
                </div>
                <div>
                  <Lbl>Notas adicionales <span style={{ color: C.muted, fontWeight: 400 }}>(opcional)</span></Lbl>
                  <input style={inp} type="text" placeholder="Observaciones del médico..."
                    value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                <button type="button" style={btnG}
                  onClick={() => { setView('history'); setEditingId(null); setSaveError(''); setForm(emptyForm); }}>
                  Cancelar
                </button>
                <button type="submit" style={btnP} disabled={saving}>
                  {saving ? 'Guardando...' : view === 'edit' ? '💾 Guardar Cambios' : '💾 Guardar Registro'}
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