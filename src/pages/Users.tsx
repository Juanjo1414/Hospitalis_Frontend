import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface UserItem {
  _id: string;
  fullname: string;
  email: string;
  role: 'admin' | 'medico';
  isActive: boolean;
  createdAt?: string;
}

// ── API ───────────────────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const getUsers    = (p?: any)           => API.get('/users', { params: p });
const updateUser  = (id: string, d: any)=> API.patch(`/users/${id}`, d);
const deleteUser  = (id: string)        => API.delete(`/users/${id}`);
const hardDelete  = (id: string)        => API.delete(`/users/${id}/hard`);

// ── Helper: leer rol del JWT ──────────────────────────────────────────────────
function getUserRole(): string {
  try {
    const t = localStorage.getItem('accessToken');
    if (!t) return '';
    return JSON.parse(atob(t.split('.')[1])).role ?? '';
  } catch { return ''; }
}

// ── Colores ───────────────────────────────────────────────────────────────────
const C = {
  primary:'#137fec', white:'#ffffff',
  bg:'#f6f7f8', border:'#e5e7eb',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8',
  green:'#16a34a', greenBg:'#dcfce7',
  red:'#dc2626', redBg:'#fee2e2',
  gray:'#64748b', grayBg:'#f1f5f9',
  blue:'#2563eb', blueBg:'#dbeafe',
  purple:'#7c3aed', purpleBg:'#ede9fe',
};

const card: React.CSSProperties = { background: C.white, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
const inp: React.CSSProperties  = { padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: 'none', width: '100%', boxSizing: 'border-box' };
const btnP: React.CSSProperties = { background: C.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnG: React.CSSProperties = { background: 'transparent', color: C.sub, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer' };
const btnD: React.CSSProperties = { background: C.redBg, color: C.red, border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

const ini = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

const RoleBadge = ({ role }: { role: string }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 999,
    fontSize: 11, fontWeight: 600,
    background: role === 'admin' ? C.purpleBg : C.blueBg,
    color:      role === 'admin' ? C.purple   : C.blue,
  }}>
    {role === 'admin' ? '🛡️ Admin' : '👨‍⚕️ Médico'}
  </span>
);

const StatusBadge = ({ active }: { active: boolean }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 999,
    fontSize: 11, fontWeight: 600,
    background: active ? C.greenBg : C.grayBg,
    color:      active ? C.green   : C.gray,
  }}>
    {active ? 'Activo' : 'Inactivo'}
  </span>
);

// ── Modal de edición ──────────────────────────────────────────────────────────
const EditModal = ({ user, onClose, onSaved }: { user: UserItem; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm]   = useState({ fullname: user.fullname, email: user.email, role: user.role, isActive: user.isActive, password: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload: any = { fullname: form.fullname, email: form.email, role: form.role, isActive: form.isActive };
      if (form.password.trim()) payload.password = form.password;
      await updateUser(user._id, payload);
      onSaved();
      onClose();
    } catch (ex: any) {
      setErr(ex?.response?.data?.message ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: C.white, borderRadius: 14, padding: 32, width: 480, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 20px' }}>✏️ Editar Usuario</h2>
        {err && <div style={{ background: C.redBg, color: C.red, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{err}</div>}
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Nombre completo *</span>
              <input style={inp} value={form.fullname} onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))} required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Email *</span>
              <input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Rol</span>
              <select style={{ ...inp, background: C.white, cursor: 'pointer' }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Estado</span>
              <select style={{ ...inp, background: C.white, cursor: 'pointer' }} value={String(form.isActive)} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Nueva contraseña <span style={{ color: C.muted, fontWeight: 400 }}>(dejar vacío para no cambiar)</span></span>
              <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" style={btnG} onClick={onClose}>Cancelar</button>
            <button type="submit" style={btnP} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
export const Users = () => {
  const [users,   setUsers]   = useState<UserItem[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [rf,      setRf]      = useState('');       // filtro rol
  const [af,      setAf]      = useState('');       // filtro activo
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [editing, setEditing] = useState<UserItem | null>(null);

  const isAdmin = getUserRole() === 'admin';

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await getUsers({
        role:     rf || undefined,
        isActive: af !== '' ? af : undefined,
        page, limit: 10,
      });
      setUsers(r.data.data);
      setTotal(r.data.total);
    } catch (e: any) {
      if (e?.response?.status === 403) setErr('Acceso denegado. Solo los administradores pueden gestionar usuarios.');
      else setErr('Error al cargar usuarios.');
    } finally { setLoading(false); }
  }, [rf, af, page]);

  useEffect(() => { load(); }, [load]);

  const deactivate = async (id: string, name: string) => {
    if (!confirm(`¿Desactivar al usuario "${name}"?`)) return;
    try { await deleteUser(id); await load(); }
    catch { setErr('Error al desactivar usuario.'); }
  };

  const eliminate = async (id: string, name: string) => {
    if (!confirm(`¿ELIMINAR PERMANENTEMENTE a "${name}"? Esta acción no se puede deshacer.`)) return;
    try { await hardDelete(id); await load(); }
    catch { setErr('Error al eliminar usuario.'); }
  };

  const pages = Math.ceil(total / 10);

  // ── Guard visual: si no es admin, mostrar acceso denegado ─────────────────
  if (!isAdmin) return (
    <div style={{ padding: '28px 32px', background: C.bg, minHeight: '100vh', fontFamily: "'Inter',-apple-system,sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '48px 32px', background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>Acceso Restringido</h2>
        <p style={{ fontSize: 13, color: C.muted }}>Solo los administradores pueden gestionar usuarios del sistema.</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', background: C.bg, minHeight: '100vh', fontFamily: "'Inter',-apple-system,sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Gestión de Usuarios</h1>
        <p style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>Administra los usuarios del sistema y sus roles.</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select style={{ ...inp, width: 'auto', background: C.white, cursor: 'pointer' }} value={rf} onChange={e => { setRf(e.target.value); setPage(1); }}>
          <option value="">Todos los roles</option>
          <option value="medico">Médico</option>
          <option value="admin">Administrador</option>
        </select>
        <select style={{ ...inp, width: 'auto', background: C.white, cursor: 'pointer' }} value={af} onChange={e => { setAf(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        {(rf || af) && (
          <button style={{ ...btnG, color: C.red }} onClick={() => { setRf(''); setAf(''); setPage(1); }}>✕ Limpiar</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: C.muted }}>{total} usuarios</span>
      </div>

      {err && <div style={{ color: C.red, background: C.redBg, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{err}</div>}

      {/* Tabla */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Usuario', 'Email', 'Rol', 'Estado', 'Registrado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: C.muted }}>Cargando...</td></tr>
              : users.length === 0
                ? <tr><td colSpan={6}>
                    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No hay usuarios</div>
                      <div style={{ fontSize: 13, color: C.muted }}>No se encontraron usuarios con esos filtros.</div>
                    </div>
                  </td></tr>
                : users.map(u => (
                    <tr key={u._id} style={{ borderBottom: `1px solid ${C.grayBg}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>

                      {/* Usuario */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'admin' ? C.purpleBg : C.blueBg, color: u.role === 'admin' ? C.purple : C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {ini(u.fullname)}
                          </div>
                          <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{u.fullname}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: 13, color: C.sub }}>{u.email}</td>

                      {/* Rol */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}><RoleBadge role={u.role} /></td>

                      {/* Estado */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}><StatusBadge active={u.isActive} /></td>

                      {/* Fecha */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: 12, color: C.muted }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={{ background: 'transparent', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
                            title="Editar usuario"
                            onClick={() => setEditing(u)}
                          >✏️</button>
                          {u.isActive
                            ? <button
                                style={{ background: 'transparent', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
                                title="Desactivar usuario"
                                onClick={() => deactivate(u._id, u.fullname)}
                              >🚫</button>
                            : <button
                                style={{ background: 'transparent', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
                                title="Eliminar permanentemente"
                                onClick={() => eliminate(u._id, u.fullname)}
                              >🗑️</button>
                          }
                        </div>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 13, color: C.gray }}>
          <button style={btnG} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span>Página {page} de {pages} · {total} usuarios</span>
          <button style={btnG} disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Nota sobre registro de nuevos usuarios */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: C.blueBg, border: `1px solid #bfdbfe`, borderRadius: 10, fontSize: 13, color: C.blue }}>
        ℹ️ Para crear nuevos usuarios, deben registrarse desde <strong>/register</strong>. El administrador puede cambiar su rol y estado desde esta página.
      </div>

      {/* Modal edición */}
      {editing && (
        <EditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default Users;