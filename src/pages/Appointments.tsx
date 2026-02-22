import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getAppointments, createAppointment, updateAppointment,
  deleteAppointment, getAppointment,
} from '../services/appointments.service';
import type { Appointment } from '../services/appointments.service';
import { getPatients } from '../services/patient.service';
import type { Patient } from '../services/patient.service';

type View = 'list' | 'create' | 'detail';

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

const STATUS_LABELS: Record<string,string> = { scheduled:'Scheduled', confirmed:'Confirmed', in_progress:'In Progress', completed:'Completed', cancelled:'Cancelled', no_show:'No Show' };
const STATUS_STYLE: Record<string,[string,string]> = { scheduled:[C.blueBg,C.blue], confirmed:[C.greenBg,C.green], in_progress:[C.orangeBg,C.orange], completed:[C.grayBg,C.gray], cancelled:[C.redBg,C.red], no_show:[C.grayBg,C.gray] };
const TYPE_LABELS: Record<string,string> = { checkup:'General Checkup', follow_up:'Follow-up', consultation:'Consultation', emergency:'Emergency', procedure:'Procedure', lab:'Lab' };

const emptyForm = { patientId:'', date:'', startTime:'', endTime:'', type:'checkup', reason:'', notes:'', room:'', status:'scheduled' };

const card: React.CSSProperties = { background:C.white, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' };
const inp: React.CSSProperties = { padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:C.text, outline:'none', width:'100%' };
const sel: React.CSSProperties = { ...inp, background:C.white, cursor:'pointer' };
const btnP: React.CSSProperties = { background:C.primary, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' };
const btnG: React.CSSProperties = { background:'transparent', color:C.sub, border:'1px solid #e5e7eb', borderRadius:10, padding:'8px 16px', fontSize:13, cursor:'pointer' };
const btnD: React.CSSProperties = { background:C.redBg, color:C.red, border:'none', borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer' };

const Badge = ({s}:{s:string})=>{ const [bg,color]=STATUS_STYLE[s]??[C.grayBg,C.gray]; return <span style={{ background:bg,color,padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:600 }}>{STATUS_LABELS[s]??s}</span>; };
const Tag = ({t}:{t:string})=><span style={{ background:C.grayBg,color:C.sub,padding:'2px 8px',borderRadius:4,fontSize:11 }}>{t}</span>;

const fmtDate = (d:string) => new Date(d).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'});
const getDoctorId = () => { try { const t=localStorage.getItem('accessToken')||''; const p=JSON.parse(atob(t.split('.')[1])); return p.sub||''; } catch { return ''; }};

export const Appointments = () => {
  const [view, setView] = useState<View>('list');
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sf, setSf] = useState('');
  const [df, setDf] = useState('');
  const [loading, setLoading] = useState(false);
  const [sel2, setSel] = useState<Appointment|null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);

  const user = JSON.parse(localStorage.getItem('user')||'{}');
  const name = user.fullName||'Doctor';
  const av = name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();

  const load = useCallback(async()=>{
    setLoading(true);
    try{ const r=await getAppointments({status:sf||undefined,date:df||undefined,page,limit:10}); setAppts(r.data.data); setTotal(r.data.total); }
    catch{ setErr('Error loading appointments'); }
    finally{ setLoading(false); }
  },[sf,df,page]);

  useEffect(()=>{ load(); },[load]);

  const openCreate = async()=>{ try{ const r=await getPatients({limit:100}); setPatients(r.data.data); }catch{}; setForm(emptyForm); setErr(''); setView('create'); };
  const openDetail = async(id:string)=>{ try{ const r=await getAppointment(id); setSel(r.data); setView('detail'); }catch{ setErr('Error'); }};
  const submit = async(e:React.FormEvent)=>{ e.preventDefault(); setSaving(true); setErr(''); try{ await createAppointment({...form,doctorId:getDoctorId()} as any); await load(); setView('list'); }catch(ex:any){ setErr(ex?.response?.data?.message||'Error'); }finally{ setSaving(false); }};
  const changeStatus = async(id:string,status:string)=>{ try{ await updateAppointment(id,{status}); const r=await getAppointment(id); setSel(r.data); await load(); }catch{ setErr('Error'); }};
  const del = async(id:string)=>{ if(!confirm('Delete?')) return; try{ await deleteAppointment(id); await load(); setView('list'); }catch{ setErr('Error'); }};

  const pages = Math.ceil(total/10);

  const navL = (to:string,label:string,active=false) => (
    <Link to={to} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,fontSize:14,color:active?C.primary:C.sub,textDecoration:'none',background:active?C.primaryBg:'transparent',fontWeight:active?600:400 }}>
      <span style={{ width:8,height:8,borderRadius:'50%',background:active?C.primary:'#cbd5e1',flexShrink:0,display:'inline-block' }}/>
      {label}
    </Link>
  );

  const Sidebar = ()=>(
    <aside style={{ width:240,minWidth:240,background:C.white,borderRight:`1px solid ${C.border}`,padding:'22px 18px',display:'flex',flexDirection:'column',minHeight:'100vh',position:'sticky',top:0,height:'100vh',overflowY:'auto' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:24 }}>
        <div style={{ width:32,height:32,borderRadius:8,background:'#e0e7ff',color:C.primary,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,flexShrink:0 }}>+</div>
        <div><div style={{ fontWeight:700,color:C.text,fontSize:15 }}>Hospitalis</div><div style={{ fontSize:11,color:C.muted }}>Medical System</div></div>
      </div>
      <nav style={{ display:'flex',flexDirection:'column',gap:2,flex:1 }}>
        {navL('/dashboard','Dashboard')}
        {navL('/patients','Patients')}
        {navL('/appointments','Appointments',true)}
        {navL('/dashboard','Messages')}
        {navL('/dashboard','Pharmacy')}
        {navL('/dashboard','Settings')}
      </nav>
      <div style={{ marginTop:'auto',display:'flex',alignItems:'center',gap:10,padding:'12px 6px',borderTop:`1px solid ${C.border}` }}>
        <div style={{ width:32,height:32,borderRadius:'50%',background:C.primary,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0 }}>{av}</div>
        <div><div style={{ fontSize:13,fontWeight:600,color:C.text }}>Dr. {name}</div><div style={{ fontSize:11,color:C.muted }}>{user.specialty||'Médico'}</div></div>
      </div>
    </aside>
  );

  const Topbar = ({title}:{title:string})=>(
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
      <h1 style={{ fontSize:22,fontWeight:700,color:C.text,margin:0 }}>{title}</h1>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <button style={{ background:C.white,border:'1px solid #e5e7eb',borderRadius:8,padding:'7px 10px',cursor:'pointer' }}>🔔</button>
        <div style={{ width:32,height:32,borderRadius:'50%',background:C.primary,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700 }}>{av}</div>
      </div>
    </div>
  );

  // LIST
  if(view==='list') return (
    <div style={{ display:'flex',minHeight:'100vh',fontFamily:"'Inter',-apple-system,sans-serif",background:C.bg }}>
      <Sidebar/>
      <main style={{ flex:1,minWidth:0,padding:'28px 32px' }}>
        <Topbar title="Appointments"/>
        {err&&<div style={{ color:C.red,background:C.redBg,padding:'10px 14px',borderRadius:8,marginBottom:12,fontSize:13 }}>{err}</div>}
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap' }}>
          <input type="date" style={{ ...sel,width:'auto' }} value={df} onChange={e=>{ setDf(e.target.value); setPage(1); }}/>
          <select style={{ ...sel,width:'auto' }} value={sf} onChange={e=>{ setSf(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option><option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option><option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button style={btnP} onClick={openCreate}>+ New Appointment</button>
          {(sf||df)&&<button style={btnG} onClick={()=>{ setSf(''); setDf(''); }}>Clear filters</button>}
        </div>
        <div style={{ ...card,padding:0,overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Date & Time','Patient','Type','Reason','Room','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading?<tr><td colSpan={7} style={{ textAlign:'center',padding:40,color:C.muted }}>Loading...</td></tr>
              :appts.length===0?<tr><td colSpan={7}>
                <div style={{ textAlign:'center',padding:'48px 24px' }}>
                  <div style={{ fontSize:40,marginBottom:12 }}>📅</div>
                  <div style={{ fontSize:16,fontWeight:600,color:'#374151',marginBottom:6 }}>No appointments found</div>
                  <div style={{ fontSize:13,color:C.muted,marginBottom:16 }}>Schedule your first appointment.</div>
                  <button style={btnP} onClick={openCreate}>+ New Appointment</button>
                </div>
              </td></tr>
              :appts.map(a=>{
                const pat = typeof a.patientId==='object'?a.patientId:null;
                return (
                  <tr key={a._id} onClick={()=>openDetail(a._id)} style={{ cursor:'pointer',borderBottom:'1px solid #f1f5f9' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'14px 16px',verticalAlign:'middle' }}>
                      <div style={{ fontWeight:600,fontSize:13,color:C.text }}>{fmtDate(a.date)}</div>
                      <div style={{ fontSize:11,color:C.muted }}>{a.startTime} – {a.endTime}</div>
                    </td>
                    <td style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13,fontWeight:500 }}>
                      {pat?`${pat.firstName} ${pat.lastName}`:'—'}
                    </td>
                    <td style={{ padding:'14px 16px',verticalAlign:'middle' }}><Tag t={TYPE_LABELS[a.type]??a.type}/></td>
                    <td style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13,maxWidth:160 }}>
                      <div style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{a.reason}</div>
                    </td>
                    <td style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13 }}>{a.room||'—'}</td>
                    <td style={{ padding:'14px 16px',verticalAlign:'middle' }}><Badge s={a.status}/></td>
                    <td style={{ padding:'14px 16px',verticalAlign:'middle' }} onClick={e=>e.stopPropagation()}>
                      <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} onClick={()=>openDetail(a._id)}>👁️</button>
                      <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} onClick={()=>del(a._id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pages>1&&(
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:16,fontSize:13,color:C.gray }}>
            <button style={btnG} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <span>Page {page} of {pages} · {total} appointments</span>
            <button style={btnG} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        )}
      </main>
    </div>
  );

  // DETAIL
  if(view==='detail'&&sel2) {
    const pat = typeof sel2.patientId==='object'?sel2.patientId:null;
    const doc = typeof sel2.doctorId==='object'?sel2.doctorId:null;
    return (
      <div style={{ display:'flex',minHeight:'100vh',fontFamily:"'Inter',-apple-system,sans-serif",background:C.bg }}>
        <Sidebar/>
        <main style={{ flex:1,minWidth:0,padding:'28px 32px' }}>
          <Topbar title="Appointment Detail"/>
          <button style={{ ...btnG,marginBottom:16 }} onClick={()=>setView('list')}>← Back to Appointments</button>
          <div style={{ display:'grid',gridTemplateColumns:'320px 1fr',gap:16,alignItems:'start' }}>
            <div style={card}>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',marginBottom:8 }}>Appointment</div>
                <h2 style={{ margin:'0 0 4px',color:C.text,fontSize:18 }}>{fmtDate(sel2.date)}</h2>
                <div style={{ fontSize:13,color:C.muted }}>{sel2.startTime} – {sel2.endTime}</div>
                <div style={{ marginTop:10 }}><Badge s={sel2.status}/></div>
              </div>
              {pat&&(
                <div style={{ marginBottom:14,paddingBottom:14,borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',marginBottom:8 }}>Patient</div>
                  <div style={{ fontSize:13,fontWeight:500,marginBottom:4 }}>{pat.firstName} {pat.lastName}</div>
                  {pat.email&&<div style={{ fontSize:12,color:C.muted }}>{pat.email}</div>}
                  {pat.phone&&<div style={{ fontSize:12,color:C.muted }}>{pat.phone}</div>}
                </div>
              )}
              {doc&&(
                <div style={{ marginBottom:14,paddingBottom:14,borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',marginBottom:8 }}>Doctor</div>
                  <div style={{ fontSize:13,fontWeight:500 }}>{doc.fullname}</div>
                  {doc.specialty&&<div style={{ fontSize:12,color:C.muted }}>{doc.specialty}</div>}
                </div>
              )}
              <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',marginBottom:8 }}>Details</div>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6 }}><span style={{ color:C.muted }}>Type</span><Tag t={TYPE_LABELS[sel2.type]??sel2.type}/></div>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}><span style={{ color:C.muted }}>Room</span><span>{sel2.room||'—'}</span></div>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div style={card}>
                <h3 style={{ fontSize:15,fontWeight:600,marginBottom:8 }}>Reason for Visit</h3>
                <p style={{ fontSize:13,color:'#475569',lineHeight:1.6 }}>{sel2.reason}</p>
              </div>
              {sel2.notes&&<div style={card}><h3 style={{ fontSize:15,fontWeight:600,marginBottom:8 }}>Clinical Notes</h3><p style={{ fontSize:13,color:'#475569',lineHeight:1.6 }}>{sel2.notes}</p></div>}
              <div style={card}>
                <h3 style={{ fontSize:15,fontWeight:600,marginBottom:12 }}>Update Status</h3>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8 }}>
                  {Object.entries(STATUS_LABELS).map(([k,label])=>{
                    const [bg,color]=STATUS_STYLE[k]??[C.grayBg,C.gray];
                    return (
                      <button key={k} onClick={()=>changeStatus(sel2._id,k)}
                        style={{ background:sel2.status===k?'#f0f9ff':'transparent', border:sel2.status===k?`2px solid ${C.primary}`:'2px solid transparent', borderRadius:10, padding:8, cursor:'pointer', transition:'all 0.15s' }}>
                        <span style={{ background:bg,color,padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:600 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button style={btnD} onClick={()=>del(sel2._id)}>Delete Appointment</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // CREATE
  return (
    <div style={{ display:'flex',minHeight:'100vh',fontFamily:"'Inter',-apple-system,sans-serif",background:C.bg }}>
      <Sidebar/>
      <main style={{ flex:1,minWidth:0,padding:'28px 32px' }}>
        <Topbar title="New Appointment"/>
        <button style={{ ...btnG,marginBottom:16 }} onClick={()=>setView('list')}>← Back</button>
        <form style={{ ...card,maxWidth:720 }} onSubmit={submit}>
          {err&&<div style={{ color:C.red,background:C.redBg,padding:'10px 14px',borderRadius:8,marginBottom:16,fontSize:13 }}>{err}</div>}

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:14 }}>Patient</div>
            <label style={{ display:'flex',flexDirection:'column',gap:6 }}>
              <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>Select Patient *</span>
              <select required style={sel} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))}>
                <option value="">Choose a patient...</option>
                {patients.map(p=><option key={p._id} value={p._id}>{p.firstName} {p.lastName} — {p.email}</option>)}
              </select>
            </label>
          </div>

          <div style={{ paddingTop:16,borderTop:'1px solid #f1f5f9',marginBottom:20 }}>
            <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:14 }}>Schedule</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
              {[
                {l:'Date *',k:'date',type:'date',req:true},{l:'Type',k:'type',type:'select',opts:Object.entries(TYPE_LABELS)},
                {l:'Start Time *',k:'startTime',type:'time',req:true},{l:'End Time *',k:'endTime',type:'time',req:true},
                {l:'Room / Consultorio',k:'room',ph:'e.g. Consultorio 3'},{l:'Initial Status',k:'status',type:'select',opts:[['scheduled','Scheduled'],['confirmed','Confirmed']]},
              ].map((f:any)=>(
                <label key={f.k} style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>{f.l}</span>
                  {f.type==='select'
                    ?<select style={sel} value={(form as any)[f.k]} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}>{f.opts.map(([v,t]:string[])=><option key={v} value={v}>{t}</option>)}</select>
                    :<input style={inp} type={f.type||'text'} required={f.req} value={(form as any)[f.k]} placeholder={f.ph} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}/>}
                </label>
              ))}
              <label style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1 / -1' }}>
                <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>Reason for Visit *</span>
                <textarea required style={{ ...inp,resize:'vertical' }} rows={3} value={form.reason} placeholder="Describe the reason..." onChange={e=>setForm(f=>({...f,reason:e.target.value}))}/>
              </label>
              <label style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1 / -1' }}>
                <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>Pre-visit Notes</span>
                <textarea style={{ ...inp,resize:'vertical' }} rows={2} value={form.notes} placeholder="Optional notes..." onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              </label>
            </div>
          </div>

          <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
            <button type="button" style={btnG} onClick={()=>setView('list')}>Cancel</button>
            <button type="submit" style={btnP} disabled={saving}>{saving?'Saving...':'Create Appointment'}</button>
          </div>
        </form>
      </main>
    </div>
  );
};