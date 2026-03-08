import React, { useState, useEffect, useCallback } from 'react';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment, getAppointment, type Appointment } from '../services/appointments.service';
import { getPatients, type Patient } from '../services/patient.service';

type View = 'list' | 'create' | 'detail' | 'edit';

const C = {
  primary:'#137fec', bg:'#f6f7f8', white:'#ffffff', border:'#eef2f7',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8',
  green:'#16a34a', greenBg:'#dcfce7', red:'#dc2626', redBg:'#fee2e2',
  orange:'#ea580c', orangeBg:'#ffedd5', blue:'#2563eb', blueBg:'#dbeafe',
  gray:'#64748b', grayBg:'#f1f5f9', yellow:'#d97706', yellowBg:'#fef3c7',
};

const STATUS_LABELS: Record<string,string> = {
  scheduled:'Programada', confirmed:'Confirmada', in_progress:'En Progreso',
  completed:'Completada', cancelled:'Cancelada', no_show:'No Asistió',
};
const STATUS_STYLE: Record<string,[string,string]> = {
  scheduled:[C.blueBg,C.blue], confirmed:[C.greenBg,C.green],
  in_progress:[C.orangeBg,C.orange], completed:[C.grayBg,C.gray],
  cancelled:[C.redBg,C.red], no_show:[C.grayBg,C.gray],
};
const TYPE_LABELS: Record<string,string> = {
  checkup:'Control General', follow_up:'Seguimiento', consultation:'Consulta',
  emergency:'Urgencia', procedure:'Procedimiento', lab:'Laboratorio',
};

const emptyForm = { patientId:'', date:'', startTime:'', endTime:'', type:'checkup', reason:'', notes:'', room:'', status:'scheduled' };

const card: React.CSSProperties = { background:C.white, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' };
const inp: React.CSSProperties  = { padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:C.text, outline:'none', width:'100%' };
const sel: React.CSSProperties  = { ...inp, background:C.white, cursor:'pointer' };
const btnP: React.CSSProperties = { background:C.primary, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' };
const btnG: React.CSSProperties = { background:'transparent', color:C.sub, border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 16px', fontSize:13, cursor:'pointer' };
const btnD: React.CSSProperties = { background:C.redBg, color:C.red, border:'none', borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer' };

function getUserRole(): string {
  const token = localStorage.getItem('accessToken');
  if (!token) return '';
  const base64  = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const jsonStr = decodeURIComponent(Array.from(atob(base64)).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
  return JSON.parse(jsonStr).role ?? '';
}
function getDoctorId(): string {
  const token = localStorage.getItem('accessToken');
  if (!token) return '';
  const base64  = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const jsonStr = decodeURIComponent(Array.from(atob(base64)).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
  return JSON.parse(jsonStr).sub ?? '';
}

function fmtDate(d: string): string {
  if (!d) return '—';
  const datePart = d.includes('T') ? d.split('T')[0] : d;
  return new Date(datePart.replace(/-/g,'/')).toLocaleDateString('es-CO',{ day:'2-digit', month:'short', year:'numeric' });
}
function toDateInput(d: string): string {
  if (!d) return '';
  return d.includes('T') ? d.split('T')[0] : d;
}

const Badge = ({s}:{s:string}) => {
  const [bg,color] = STATUS_STYLE[s] ?? [C.grayBg,C.gray];
  return <span style={{ background:bg,color,padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:600 }}>{STATUS_LABELS[s]??s}</span>;
};
const Tag = ({t}:{t:string}) => (
  <span style={{ background:C.grayBg,color:C.sub,padding:'2px 8px',borderRadius:4,fontSize:11 }}>{t}</span>
);

const css = `
  .apt-wrap { padding:28px 32px; background:${C.bg}; min-height:100vh; font-family:'Inter',-apple-system,sans-serif; }
  .apt-filters { display:flex; align-items:center; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
  .apt-detail-grid { display:grid; grid-template-columns:320px 1fr; gap:16px; align-items:start; }
  .apt-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .apt-status-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }

  @media (max-width:1024px) {
    .apt-detail-grid { grid-template-columns:260px 1fr; }
  }
  @media (max-width:768px) {
    .apt-wrap { padding:16px; }
    .apt-filters { flex-direction:column; align-items:stretch; }
    .apt-detail-grid { grid-template-columns:1fr; }
    .apt-form-grid { grid-template-columns:1fr; }
    .apt-status-grid { grid-template-columns:repeat(2,1fr); }
    .apt-table thead { display:none; }
    .apt-table tbody tr { display:block; border:1px solid ${C.border}; border-radius:10px; margin-bottom:10px; padding:12px; }
    .apt-table tbody td { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border:none; font-size:13px; }
    .apt-table tbody td::before { content:attr(data-label); font-size:11px; font-weight:600; color:${C.muted}; text-transform:uppercase; }
  }
`;

// ── Formulario compartido ─────────────────────────────────────────────────────
const AptForm = ({ title, form, setForm, patients, saving, err, onSubmit, onCancel, submitLabel }:{
  title:string; form:typeof emptyForm; setForm:React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  patients:Patient[]; saving:boolean; err:string;
  onSubmit:(e:React.FormEvent)=>void; onCancel:()=>void; submitLabel:string;
}) => (
  <div className="apt-wrap">
    <style>{css}</style>
    <h1 style={{ fontSize:22,fontWeight:700,color:C.text,margin:'0 0 12px' }}>{title}</h1>
    <button style={{ ...btnG,marginBottom:16 }} onClick={onCancel}>← Volver</button>
    <form style={{ ...card,maxWidth:720 }} onSubmit={onSubmit}>
      {err && <div style={{ color:C.red,background:C.redBg,padding:'10px 14px',borderRadius:8,marginBottom:16,fontSize:13 }}>{err}</div>}

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:14 }}>Paciente</div>
        <label style={{ display:'flex',flexDirection:'column',gap:6 }}>
          <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>Seleccionar Paciente *</span>
          <select required style={sel} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))}>
            <option value="">Elige un paciente...</option>
            {patients.map(p=><option key={p._id} value={p._id}>{p.firstName} {p.lastName} — {p.email}</option>)}
          </select>
        </label>
      </div>

      <div style={{ paddingTop:16,borderTop:'1px solid #f1f5f9',marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:14 }}>Programación</div>
        <div className="apt-form-grid">
          {[
            {l:'Fecha *',k:'date',type:'date',req:true},
            {l:'Tipo',k:'type',type:'select',opts:Object.entries(TYPE_LABELS)},
            {l:'Hora de Inicio *',k:'startTime',type:'time',req:true},
            {l:'Hora de Fin *',k:'endTime',type:'time',req:true},
            {l:'Consultorio / Sala',k:'room',ph:'ej. Consultorio 3'},
            {l:'Estado',k:'status',type:'select',opts:[['scheduled','Programada'],['confirmed','Confirmada'],['in_progress','En Progreso'],['completed','Completada'],['cancelled','Cancelada']]},
          ].map((f:any)=>(
            <label key={f.k} style={{ display:'flex',flexDirection:'column',gap:6 }}>
              <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>{f.l}</span>
              {f.type==='select'
                ?<select style={sel} value={(form as any)[f.k]} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}>
                    {f.opts.map(([v,t]:string[])=><option key={v} value={v}>{t}</option>)}
                  </select>
                :<input style={inp} type={f.type||'text'} required={f.req} value={(form as any)[f.k]} placeholder={f.ph} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}/>
              }
            </label>
          ))}
          <label style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1 / -1' }}>
            <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>Motivo de Consulta *</span>
            <textarea required style={{ ...inp,resize:'vertical' }} rows={3} value={form.reason} placeholder="Describe el motivo..." onChange={e=>setForm(f=>({...f,reason:e.target.value}))}/>
          </label>
          <label style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1 / -1' }}>
            <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>Notas Previas</span>
            <textarea style={{ ...inp,resize:'vertical' }} rows={2} value={form.notes} placeholder="Notas opcionales..." onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
          </label>
        </div>
      </div>

      <div style={{ display:'flex',justifyContent:'flex-end',gap:10,flexWrap:'wrap' }}>
        <button type="button" style={btnG} onClick={onCancel}>Cancelar</button>
        <button type="submit" style={btnP} disabled={saving}>{saving?'Guardando...':submitLabel}</button>
      </div>
    </form>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export const Appointments = () => {
  const [view, setView]         = useState<View>('list');
  const [appts, setAppts]       = useState<Appointment[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [sf, setSf]             = useState('');
  const [df, setDf]             = useState('');
  const [loading, setLoading]   = useState(false);
  const [sel2, setSel]          = useState<Appointment|null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const isAdmin = getUserRole() === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getAppointments({status:sf||undefined,date:df||undefined,page,limit:10}); setAppts(r.data.data); setTotal(r.data.total); }
    catch { setErr('Error al cargar citas'); }
    finally { setLoading(false); }
  },[sf,df,page]);

  useEffect(()=>{ load(); },[load]);

  const loadPatients = async () => {
    try { const r = await getPatients({limit:100}); setPatients(r.data.data); } catch {}
  };

  const openCreate = async () => { await loadPatients(); setForm(emptyForm); setErr(''); setView('create'); };
  const openDetail = async (id:string) => { try{ const r=await getAppointment(id); setSel(r.data); setView('detail'); }catch{ setErr('Error'); }};
  const openEdit   = async (appt:Appointment) => {
    await loadPatients();
    const patId = typeof appt.patientId==='object' ? (appt.patientId as any)._id : appt.patientId;
    setForm({ patientId:patId??'', date:toDateInput(appt.date), startTime:appt.startTime??'', endTime:appt.endTime??'', type:appt.type??'checkup', reason:appt.reason??'', notes:appt.notes??'', room:appt.room??'', status:appt.status??'scheduled' });
    setSel(appt); setErr(''); setView('edit');
  };

  const submitCreate = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await createAppointment({...form,doctorId:getDoctorId()} as any); await load(); setView('list'); }
    catch(ex:any){ setErr(ex?.response?.data?.message||'Error'); }
    finally{ setSaving(false); }
  };
  const submitEdit = async (e:React.FormEvent) => {
    e.preventDefault(); if(!sel2) return; setSaving(true); setErr('');
    try { await updateAppointment(sel2._id,{...form} as any); await load(); setView('list'); }
    catch(ex:any){ setErr(ex?.response?.data?.message||'Error'); }
    finally{ setSaving(false); }
  };

  const changeStatus = async (id:string, status:string) => {
    try { await updateAppointment(id,{status}); const r=await getAppointment(id); setSel(r.data); await load(); }
    catch{ setErr('Error'); }
  };
  const del = async (id:string) => {
    if(!confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) return;
    try { await deleteAppointment(id); await load(); setView('list'); }
    catch(e:any){
      if(e?.response?.status===403) setErr('Solo los administradores pueden eliminar citas.');
      else setErr('Error al eliminar cita.');
    }
  };

  const pages = Math.ceil(total/10);

  if(view==='create') return <AptForm title="Nueva Cita" form={form} setForm={setForm} patients={patients} saving={saving} err={err} onSubmit={submitCreate} onCancel={()=>setView('list')} submitLabel="Crear Cita"/>;
  if(view==='edit'&&sel2) return <AptForm title="Editar Cita" form={form} setForm={setForm} patients={patients} saving={saving} err={err} onSubmit={submitEdit} onCancel={()=>setView('detail')} submitLabel="Guardar Cambios"/>;

  // ── DETALLE ───────────────────────────────────────────────────────────────
  if(view==='detail'&&sel2){
    const pat = typeof sel2.patientId==='object' ? sel2.patientId : null;
    const doc = typeof sel2.doctorId ==='object' ? sel2.doctorId  : null;
    return (
      <div className="apt-wrap">
        <style>{css}</style>
        <h1 style={{ fontSize:22,fontWeight:700,color:C.text,margin:'0 0 12px' }}>Detalle de Cita</h1>
        <button style={{ ...btnG,marginBottom:16 }} onClick={()=>setView('list')}>← Volver a Citas</button>
        <div className="apt-detail-grid">
          <div style={card}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',marginBottom:8 }}>Cita</div>
              <h2 style={{ margin:'0 0 4px',color:C.text,fontSize:18 }}>{fmtDate(sel2.date)}</h2>
              <div style={{ fontSize:13,color:C.muted }}>{sel2.startTime} – {sel2.endTime}</div>
              <div style={{ marginTop:10 }}><Badge s={sel2.status}/></div>
            </div>
            {pat && (
              <div style={{ marginBottom:14,paddingBottom:14,borderBottom:'1px solid #f1f5f9' }}>
                <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',marginBottom:8 }}>Paciente</div>
                <div style={{ fontSize:13,fontWeight:500,marginBottom:4 }}>{(pat as any).firstName} {(pat as any).lastName}</div>
                {(pat as any).email && <div style={{ fontSize:12,color:C.muted }}>{(pat as any).email}</div>}
                {(pat as any).phone && <div style={{ fontSize:12,color:C.muted }}>{(pat as any).phone}</div>}
              </div>
            )}
            {doc && (
              <div style={{ marginBottom:14,paddingBottom:14,borderBottom:'1px solid #f1f5f9' }}>
                <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',marginBottom:8 }}>Médico</div>
                <div style={{ fontSize:13,fontWeight:500 }}>{(doc as any).fullname}</div>
              </div>
            )}
            <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',marginBottom:8 }}>Detalles</div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6 }}>
              <span style={{ color:C.muted }}>Tipo</span><Tag t={TYPE_LABELS[sel2.type]??sel2.type}/>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
              <span style={{ color:C.muted }}>Consultorio</span><span>{sel2.room||'—'}</span>
            </div>
            <div style={{ display:'flex',gap:8,marginTop:20,flexWrap:'wrap' }}>
              <button style={{ ...btnP,flex:1 }} onClick={()=>openEdit(sel2)}>✏️ Editar</button>
              {isAdmin && <button style={btnD} onClick={()=>del(sel2._id)}>🗑️ Eliminar</button>}
            </div>
          </div>

          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <div style={card}>
              <h3 style={{ fontSize:15,fontWeight:600,marginBottom:8 }}>Motivo de Consulta</h3>
              <p style={{ fontSize:13,color:'#475569',lineHeight:1.6 }}>{sel2.reason}</p>
            </div>
            {sel2.notes && (
              <div style={card}>
                <h3 style={{ fontSize:15,fontWeight:600,marginBottom:8 }}>Notas Clínicas</h3>
                <p style={{ fontSize:13,color:'#475569',lineHeight:1.6 }}>{sel2.notes}</p>
              </div>
            )}
            <div style={card}>
              <h3 style={{ fontSize:15,fontWeight:600,marginBottom:12 }}>Actualizar Estado</h3>
              <div className="apt-status-grid">
                {Object.entries(STATUS_LABELS).map(([k,label]) => {
                  const [bg,color] = STATUS_STYLE[k] ?? [C.grayBg,C.gray];
                  return (
                    <button key={k} onClick={()=>changeStatus(sel2._id,k)}
                      style={{ background:sel2.status===k?'#f0f9ff':'transparent', border:sel2.status===k?`2px solid ${C.primary}`:'2px solid transparent', borderRadius:10, padding:8, cursor:'pointer', transition:'all 0.15s' }}>
                      <span style={{ background:bg,color,padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:600 }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LISTA ─────────────────────────────────────────────────────────────────
  return (
    <div className="apt-wrap">
      <style>{css}</style>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,color:C.text,margin:0 }}>Citas</h1>
          <p style={{ fontSize:13,color:C.gray,marginTop:4 }}>Gestiona y programa las citas médicas.</p>
        </div>
      </div>

      {err && <div style={{ color:C.red,background:C.redBg,padding:'10px 14px',borderRadius:8,marginBottom:12,fontSize:13 }}>{err}</div>}

      <div className="apt-filters">
        <input type="date" style={{ ...sel,width:'auto' }} value={df} onChange={e=>{ setDf(e.target.value); setPage(1); }}/>
        <select style={{ ...sel,width:'auto' }} value={sf} onChange={e=>{ setSf(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="scheduled">Programada</option>
          <option value="confirmed">Confirmada</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <button style={btnP} onClick={openCreate}>+ Nueva Cita</button>
        {(sf||df) && <button style={btnG} onClick={()=>{ setSf(''); setDf(''); }}>Limpiar filtros</button>}
      </div>

      <div style={{ ...card,padding:0,overflow:'hidden' }}>
        <table className="apt-table" style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              {['Fecha y Hora','Paciente','Tipo','Motivo','Sala','Estado','Acciones'].map(h=>(
                <th key={h} style={{ padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ textAlign:'center',padding:40,color:C.muted }}>Cargando...</td></tr>
              : appts.length===0
                ? <tr><td colSpan={7}>
                    <div style={{ textAlign:'center',padding:'48px 24px' }}>
                      <div style={{ fontSize:40,marginBottom:12 }}>📅</div>
                      <div style={{ fontSize:16,fontWeight:600,color:'#374151',marginBottom:6 }}>No se encontraron citas</div>
                      <div style={{ fontSize:13,color:C.muted,marginBottom:16 }}>Programa tu primera cita.</div>
                      <button style={btnP} onClick={openCreate}>+ Nueva Cita</button>
                    </div>
                  </td></tr>
                : appts.map(a=>{
                    const pat = typeof a.patientId==='object' ? a.patientId : null;
                    return (
                      <tr key={a._id} onClick={()=>openDetail(a._id)} style={{ cursor:'pointer',borderBottom:'1px solid #f1f5f9' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}>
                        <td data-label="Fecha" style={{ padding:'14px 16px',verticalAlign:'middle' }}>
                          <div style={{ fontWeight:600,fontSize:13,color:C.text }}>{fmtDate(a.date)}</div>
                          <div style={{ fontSize:11,color:C.muted }}>{a.startTime} – {a.endTime}</div>
                        </td>
                        <td data-label="Paciente" style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13,fontWeight:500 }}>
                          {pat ? `${(pat as any).firstName} ${(pat as any).lastName}` : '—'}
                        </td>
                        <td data-label="Tipo" style={{ padding:'14px 16px',verticalAlign:'middle' }}><Tag t={TYPE_LABELS[a.type]??a.type}/></td>
                        <td data-label="Motivo" style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13,maxWidth:160 }}>
                          <div style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.reason}</div>
                        </td>
                        <td data-label="Sala" style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13 }}>{a.room||'—'}</td>
                        <td data-label="Estado" style={{ padding:'14px 16px',verticalAlign:'middle' }}><Badge s={a.status}/></td>
                        <td data-label="Acciones" style={{ padding:'14px 16px',verticalAlign:'middle' }} onClick={e=>e.stopPropagation()}>
                          <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} title="Ver" onClick={()=>openDetail(a._id)}>👁️</button>
                          <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} title="Editar" onClick={()=>openEdit(a)}>✏️</button>
                          {isAdmin && <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} title="Eliminar" onClick={()=>del(a._id)}>🗑️</button>}
                        </td>
                      </tr>
                    );
                  })
            }
          </tbody>
        </table>
      </div>

      {pages>1&&(
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:16,fontSize:13,color:C.gray,flexWrap:'wrap' }}>
          <button style={btnG} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Anterior</button>
          <span>Página {page} de {pages} · {total} citas</span>
          <button style={btnG} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Siguiente →</button>
        </div>
      )}
    </div>
  );
};