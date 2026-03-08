import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../services/patient.service';
import { getPatients, createPatient, updatePatient, deletePatient, getPatient } from '../services/patient.service';

type View = 'list' | 'create' | 'detail' | 'edit';

const C = {
  primary:'#137fec', primaryBg:'#eef2ff',
  bg:'#f6f7f8', white:'#ffffff', border:'#eef2f7',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8',
  green:'#16a34a', greenBg:'#dcfce7',
  red:'#dc2626', redBg:'#fee2e2',
  orange:'#ea580c', orangeBg:'#ffedd5',
  blue:'#2563eb', blueBg:'#dbeafe',
  gray:'#64748b', grayBg:'#f1f5f9',
};

const STATUS_LABELS: Record<string,string> = {
  active:'Activo', inactive:'Inactivo', inpatient:'Hospitalizado', discharged:'Dado de Alta',
};
const STATUS_STYLE: Record<string,[string,string]> = {
  active:[C.greenBg,C.green], inactive:[C.grayBg,C.gray],
  inpatient:[C.blueBg,C.blue], discharged:[C.orangeBg,C.orange],
};
const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const ini = (a='',b='') => `${a[0]??''}${b[0]??''}`.toUpperCase();

const calcAge = (d: string): string => {
  const birth = new Date(d); const today = new Date();
  if (isNaN(birth.getTime()) || birth > today) return 'Inválido';
  let y = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) y--;
  if (y < 0 || y > 130) return 'Inválido';
  return String(y);
};

function getUserRole(): string {
  const token = localStorage.getItem('accessToken');
  if (!token) return '';
  const base64  = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const jsonStr = decodeURIComponent(Array.from(atob(base64)).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
  return JSON.parse(jsonStr).role ?? '';
}

const emptyForm = {
  firstName:'', lastName:'', dateOfBirth:'', gender:'', email:'', phone:'',
  address:'', emergencyContactName:'', emergencyContactPhone:'',
  bloodType:'', allergies:'', chronicConditions:'', notes:'', status:'active',
};

const card: React.CSSProperties = { background:C.white, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' };
const inp: React.CSSProperties  = { padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:C.text, outline:'none', width:'100%' };
const sel: React.CSSProperties  = { ...inp, background:C.white, cursor:'pointer' };
const btnP: React.CSSProperties = { background:C.primary, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' };
const btnG: React.CSSProperties = { background:'transparent', color:C.sub, border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 16px', fontSize:13, cursor:'pointer' };
const btnD: React.CSSProperties = { background:C.redBg, color:C.red, border:'none', borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer' };

const Avatar = ({ a='',b='',size=36,bg='#e0e7ff' }:{a?:string,b?:string,size?:number,bg?:string}) => (
  <div style={{ width:size,height:size,borderRadius:'50%',background:bg,color:C.primary,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.33,fontWeight:700,flexShrink:0 }}>
    {ini(a,b)}
  </div>
);

const Badge = ({ s }:{s:string}) => {
  const [bg,color] = STATUS_STYLE[s]??[C.grayBg,C.gray];
  return <span style={{ background:bg,color,padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:600 }}>{STATUS_LABELS[s]??s}</span>;
};

const FRow=({k,v}:{k:string,v:string})=>(
  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13,paddingBottom:10,borderBottom:'1px solid #f1f5f9' }}>
    <span style={{ color:C.muted }}>{k}</span><span style={{ textTransform:'capitalize' }}>{v}</span>
  </div>
);

export const Patients = () => {
  const navigate = useNavigate();
  const [view,    setView]    = useState<View>('list');
  const [patients,setPatients]= useState<Patient[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [sf,      setSf]      = useState('');
  const [loading, setLoading] = useState(false);
  const [sel2,    setSel]     = useState<Patient|null>(null);
  const [form,    setForm]    = useState(emptyForm);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const isAdmin = getUserRole() === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getPatients({search,status:sf||undefined,page,limit:10}); setPatients(r.data.data); setTotal(r.data.total); }
    catch { setErr('Error al cargar pacientes'); }
    finally { setLoading(false); }
  },[search,sf,page]);

  useEffect(()=>{ load(); },[load]);

  const openCreate = ()=>{ setForm(emptyForm); setErr(''); setView('create'); };
  const openDetail = async(id:string)=>{ try{ const r=await getPatient(id); setSel(r.data); setView('detail'); }catch{ setErr('Error'); }};
  const openEdit   = (p:Patient)=>{ setSel(p); setForm({ firstName:p.firstName,lastName:p.lastName,dateOfBirth:p.dateOfBirth?.split('T')[0]||'',gender:p.gender,email:p.email,phone:p.phone||'',address:p.address||'',emergencyContactName:p.emergencyContactName||'',emergencyContactPhone:p.emergencyContactPhone||'',bloodType:p.bloodType||'',allergies:(p.allergies||[]).join(', '),chronicConditions:(p.chronicConditions||[]).join(', '),notes:p.notes||'',status:p.status }); setErr(''); setView('edit'); };

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault(); setErr('');
    if (form.dateOfBirth) {
      const birth=new Date(form.dateOfBirth); const today=new Date(); today.setHours(0,0,0,0);
      if (birth>today){ setErr('La fecha de nacimiento no puede ser una fecha futura.'); return; }
    }
    setSaving(true);
    const pay={...form,allergies:form.allergies?form.allergies.split(',').map((s:string)=>s.trim()):[],chronicConditions:form.chronicConditions?form.chronicConditions.split(',').map((s:string)=>s.trim()):[]};
    try{
      if(view==='create') await createPatient(pay as any);
      else if(sel2) await updatePatient(sel2._id,pay as any);
      await load(); setView('list');
    }catch(e:any){ setErr(e?.response?.data?.message||'Error'); }
    finally{ setSaving(false); }
  };

  const del = async(id:string)=>{
    if(!confirm('¿Eliminar este paciente? Esta acción no se puede deshacer.')) return;
    try{ await deletePatient(id); await load(); setView('list'); }
    catch(e:any){
      if(e?.response?.status===403) setErr('Solo los administradores pueden eliminar pacientes.');
      else setErr('Error al eliminar paciente.');
    }
  };

  const pages = Math.ceil(total/10);

  // ── Estilos responsive inline ─────────────────────────────────────────────
  const css = `
    .pat-wrap { padding:28px 32px; background:${C.bg}; min-height:100vh; font-family:'Inter',-apple-system,sans-serif; }
    .pat-filters { display:flex; align-items:center; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
    .pat-search { display:flex; align-items:center; gap:8px; background:${C.white}; border:1px solid #e5e7eb; border-radius:10px; padding:8px 12px; width:280px; }
    .pat-search input { border:none; outline:none; flex:1; font-size:13px; background:transparent; }
    .pat-table { width:100%; border-collapse:collapse; }
    .pat-detail-grid { display:grid; grid-template-columns:300px 1fr; gap:16px; align-items:start; }
    .pat-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

    @media (max-width:1024px) {
      .pat-detail-grid { grid-template-columns:260px 1fr; }
    }
    @media (max-width:768px) {
      .pat-wrap { padding:16px; }
      .pat-search { width:100%; }
      .pat-filters { flex-direction:column; align-items:stretch; }
      .pat-detail-grid { grid-template-columns:1fr; }
      .pat-form-grid { grid-template-columns:1fr; }
      .pat-table thead { display:none; }
      .pat-table tbody tr { display:block; border:1px solid ${C.border}; border-radius:10px; margin-bottom:10px; padding:12px; }
      .pat-table tbody td { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border:none; font-size:13px; }
      .pat-table tbody td::before { content:attr(data-label); font-size:11px; font-weight:600; color:${C.muted}; text-transform:uppercase; }
    }
  `;

  // ── LISTA ─────────────────────────────────────────────────────────────────
  if(view==='list') return (
    <div className="pat-wrap">
      <style>{css}</style>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,color:C.text,margin:0 }}>Pacientes</h1>
          <p style={{ fontSize:13,color:C.gray,marginTop:4 }}>Gestiona los expedientes y registros médicos de tus pacientes.</p>
        </div>
      </div>

      <div className="pat-filters">
        <div className="pat-search">
          <span>🔍</span>
          <input placeholder="Buscar por nombre o correo..." value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}/>
        </div>
        <select style={{ ...sel,width:'auto' }} value={sf} onChange={e=>{ setSf(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="inpatient">Hospitalizado</option>
          <option value="discharged">Dado de Alta</option>
        </select>
        <button style={btnP} onClick={openCreate}>+ Nuevo Paciente</button>
      </div>

      {err && <div style={{ color:C.red,fontSize:13,background:C.redBg,padding:'10px 14px',borderRadius:8,marginBottom:12 }}>{err}</div>}

      <div style={{ ...card,padding:0,overflow:'hidden' }}>
        <table className="pat-table">
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              {['Paciente','Contacto','Edad / Género','Condiciones','Estado','Acciones'].map(h=>(
                <th key={h} style={{ padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} style={{ textAlign:'center',padding:40,color:C.muted }}>Cargando...</td></tr>
              : patients.length===0
                ? <tr><td colSpan={6}>
                    <div style={{ textAlign:'center',padding:'48px 24px' }}>
                      <div style={{ fontSize:40,marginBottom:12 }}>👤</div>
                      <div style={{ fontSize:16,fontWeight:600,color:'#374151',marginBottom:6 }}>No se encontraron pacientes</div>
                      <div style={{ fontSize:13,color:C.muted,marginBottom:16 }}>Comienza agregando tu primer paciente.</div>
                      <button style={btnP} onClick={openCreate}>+ Agregar Paciente</button>
                    </div>
                  </td></tr>
                : patients.map(p=>(
                    <tr key={p._id} onClick={()=>openDetail(p._id)} style={{ cursor:'pointer',borderBottom:'1px solid #f1f5f9' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td data-label="Paciente" style={{ padding:'14px 16px',verticalAlign:'middle' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                          <Avatar a={p.firstName} b={p.lastName}/>
                          <div>
                            <div style={{ fontWeight:600,color:C.text,fontSize:13 }}>{p.firstName} {p.lastName}</div>
                            <div style={{ fontSize:12,color:C.muted }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Contacto" style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13 }}>
                        <div>{p.phone||'—'}</div><div style={{ fontSize:11,color:C.muted }}>{p.address||'—'}</div>
                      </td>
                      <td data-label="Edad" style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13 }}>
                        <div>{p.dateOfBirth?`${calcAge(p.dateOfBirth)} años`:'—'}</div>
                        <div style={{ fontSize:11,color:C.muted,textTransform:'capitalize' }}>{p.gender}</div>
                      </td>
                      <td data-label="Condiciones" style={{ padding:'14px 16px',verticalAlign:'middle' }}>
                        {(p.chronicConditions||[]).slice(0,2).map((c,i)=><span key={i} style={{ background:C.grayBg,color:C.sub,padding:'2px 8px',borderRadius:4,fontSize:11,marginRight:4 }}>{c}</span>)}
                        {(p.chronicConditions||[]).length===0&&<span style={{ fontSize:11,color:C.muted }}>Ninguna</span>}
                      </td>
                      <td data-label="Estado" style={{ padding:'14px 16px',verticalAlign:'middle' }}><Badge s={p.status}/></td>
                      <td data-label="Acciones" style={{ padding:'14px 16px',verticalAlign:'middle' }} onClick={e=>e.stopPropagation()}>
                        <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} title="Editar" onClick={()=>openEdit(p)}>✏️</button>
                        {isAdmin && <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} title="Eliminar" onClick={()=>del(p._id)}>🗑️</button>}
                        <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:12,color:C.primary,fontWeight:600 }} title="Historial" onClick={()=>navigate(`/patients/${p._id}/history`)}>📋</button>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      {pages>1&&(
        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:16,fontSize:13,color:C.gray,flexWrap:'wrap' }}>
          <button style={btnG} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Anterior</button>
          <span>Página {page} de {pages} · {total} pacientes</span>
          <button style={btnG} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Siguiente →</button>
        </div>
      )}
    </div>
  );

  // ── DETALLE ───────────────────────────────────────────────────────────────
  if(view==='detail'&&sel2) return (
    <div className="pat-wrap">
      <style>{css}</style>
      <h1 style={{ fontSize:22,fontWeight:700,color:C.text,margin:'0 0 12px' }}>Perfil del Paciente</h1>
      <button style={{ ...btnG,marginBottom:16 }} onClick={()=>setView('list')}>← Volver a Pacientes</button>
      <div className="pat-detail-grid">
        <div style={card}>
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:20,textAlign:'center' }}>
            <Avatar a={sel2.firstName} b={sel2.lastName} size={72} bg="#dbeafe"/>
            <h2 style={{ fontSize:18,color:C.text,margin:0 }}>{sel2.firstName} {sel2.lastName}</h2>
            <Badge s={sel2.status}/>
          </div>
          <FRow k="Fecha de Nacimiento" v={sel2.dateOfBirth?new Date(sel2.dateOfBirth).toLocaleDateString('es-CO'):'—'}/>
          <FRow k="Edad" v={sel2.dateOfBirth?`${calcAge(sel2.dateOfBirth)} años`:'—'}/>
          <FRow k="Género" v={sel2.gender}/>
          <FRow k="Tipo de Sangre" v={sel2.bloodType||'—'}/>
          <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',margin:'12px 0 8px' }}>Contacto</div>
          <FRow k="Correo" v={sel2.email}/><FRow k="Teléfono" v={sel2.phone||'—'}/><FRow k="Dirección" v={sel2.address||'—'}/>
          <div style={{ display:'flex',gap:8,marginTop:16,flexWrap:'wrap' }}>
            <button style={{ ...btnP,flex:1 }} onClick={()=>openEdit(sel2)}>Editar</button>
            <button style={btnP} onClick={()=>navigate(`/patients/${sel2._id}/history`)}>📋 Historial</button>
            {isAdmin && <button style={btnD} onClick={()=>del(sel2._id)}>Eliminar</button>}
          </div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div style={card}>
            <h3 style={{ fontSize:15,fontWeight:600,marginBottom:12 }}>Alergias</h3>
            {(sel2.allergies||[]).length>0
              ?<div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>{sel2.allergies!.map((a,i)=><span key={i} style={{ background:C.redBg,color:C.red,padding:'2px 8px',borderRadius:4,fontSize:11 }}>{a}</span>)}</div>
              :<p style={{ fontSize:13,color:C.muted }}>Sin alergias conocidas</p>}
            <h3 style={{ fontSize:15,fontWeight:600,margin:'14px 0 8px' }}>Condiciones Crónicas</h3>
            {(sel2.chronicConditions||[]).length>0
              ?<div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>{sel2.chronicConditions!.map((c,i)=><span key={i} style={{ background:C.orangeBg,color:C.orange,padding:'2px 8px',borderRadius:4,fontSize:11 }}>{c}</span>)}</div>
              :<p style={{ fontSize:13,color:C.muted }}>Sin condiciones crónicas</p>}
          </div>
          <div style={card}>
            <h3 style={{ fontSize:15,fontWeight:600,marginBottom:8 }}>Notas Clínicas</h3>
            <p style={{ fontSize:13,color:'#475569',lineHeight:1.6 }}>{sel2.notes||'Sin notas clínicas registradas.'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── FORMULARIO ────────────────────────────────────────────────────────────
  return (
    <div className="pat-wrap">
      <style>{css}</style>
      <h1 style={{ fontSize:22,fontWeight:700,color:C.text,margin:'0 0 12px' }}>{view==='create'?'Nuevo Paciente':'Editar Paciente'}</h1>
      <button style={{ ...btnG,marginBottom:16 }} onClick={()=>setView(sel2?'detail':'list')}>← Volver</button>
      <form style={{ ...card,maxWidth:800 }} onSubmit={submit}>
        {err&&<div style={{ color:C.red,fontSize:13,background:C.redBg,padding:'10px 14px',borderRadius:8,marginBottom:16 }}>{err}</div>}
        {[
          { title:'Identidad Personal', fields:[
            {l:'Nombre *',k:'firstName',req:true,ph:'ej. Juan'},{l:'Apellido *',k:'lastName',req:true,ph:'ej. Pérez'},
            {l:'Fecha de Nacimiento *',k:'dateOfBirth',req:true,type:'date',max:new Date().toISOString().split('T')[0]},
            {l:'Género *',k:'gender',req:true,type:'select',opts:[['','Seleccionar género'],['male','Masculino'],['female','Femenino'],['other','Otro']]},
          ]},
          { title:'Información de Contacto', fields:[
            {l:'Correo *',k:'email',req:true,type:'email',ph:'paciente@correo.com'},{l:'Teléfono',k:'phone',ph:'+57 300 000 0000'},
            {l:'Dirección',k:'address',ph:'Calle, Ciudad, País',span:true},
          ]},
          { title:'Contacto de Emergencia', fields:[
            {l:'Nombre',k:'emergencyContactName',ph:'Familiar o tutor'},{l:'Teléfono',k:'emergencyContactPhone',ph:'+57 300 000 0000'},
          ]},
          { title:'Perfil Clínico', fields:[
            {l:'Tipo de Sangre',k:'bloodType',type:'select',opts:[['','Desconocido'],...BLOOD_TYPES.map(b=>[b,b])]},
            {l:'Estado',k:'status',type:'select',opts:[['active','Activo'],['inactive','Inactivo'],['inpatient','Hospitalizado'],['discharged','Dado de Alta']]},
            {l:'Alergias (separadas por coma)',k:'allergies',ph:'Penicilina, Aspirina...',span:true},
            {l:'Condiciones Crónicas (separadas por coma)',k:'chronicConditions',ph:'Hipertensión, Diabetes...',span:true},
            {l:'Notas Clínicas',k:'notes',type:'textarea',ph:'Notas adicionales...',span:true},
          ]},
        ].map(section=>(
          <div key={section.title} style={{ marginBottom:24,paddingBottom:20,borderBottom:'1px solid #f1f5f9' }}>
            <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:14 }}>{section.title}</div>
            <div className="pat-form-grid">
              {section.fields.map((f:any)=>(
                <label key={f.k} style={{ display:'flex',flexDirection:'column',gap:6,...(f.span?{gridColumn:'1 / -1'}:{}) }}>
                  <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>{f.l}</span>
                  {f.type==='select'
                    ?<select style={sel} required={f.req} value={(form as any)[f.k]} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}>
                        {f.opts.map(([v,t]:string[])=><option key={v} value={v}>{t}</option>)}
                      </select>
                    :f.type==='textarea'
                      ?<textarea style={{ ...inp,resize:'vertical' }} rows={3} value={(form as any)[f.k]} placeholder={f.ph} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}/>
                      :<input style={inp} type={f.type||'text'} required={f.req} value={(form as any)[f.k]} placeholder={f.ph} max={f.max} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}/>
                  }
                </label>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display:'flex',justifyContent:'flex-end',gap:10,flexWrap:'wrap' }}>
          <button type="button" style={btnG} onClick={()=>setView(sel2?'detail':'list')}>Cancelar</button>
          <button type="submit" style={btnP} disabled={saving}>{saving?'Guardando...':view==='create'?'Crear Paciente':'Guardar Cambios'}</button>
        </div>
      </form>
    </div>
  );
};