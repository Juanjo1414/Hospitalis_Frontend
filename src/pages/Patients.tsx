import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Patient } from '../services/patient.service';
import {
  getPatients, createPatient, updatePatient,
  deletePatient, getPatient,
} from '../services/patient.service';

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

const STATUS_LABELS: Record<string,string> = { active:'Active', inactive:'Inactive', inpatient:'In-Patient', discharged:'Discharged' };
const STATUS_STYLE: Record<string,[string,string]> = {
  active:[C.greenBg,C.green], inactive:[C.grayBg,C.gray],
  inpatient:[C.blueBg,C.blue], discharged:[C.orangeBg,C.orange],
};
const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const ini = (a='',b='') => `${a[0]??''}${b[0]??''}`.toUpperCase();
const calcAge = (d: string): string => {
  const birth = new Date(d);
  const today = new Date();
  if (isNaN(birth.getTime()) || birth > today) return 'Invalid';
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
  return String(years);
};

const emptyForm = { firstName:'',lastName:'',dateOfBirth:'',gender:'',email:'',phone:'',address:'',emergencyContactName:'',emergencyContactPhone:'',bloodType:'',allergies:'',chronicConditions:'',notes:'',status:'active' };

// Shared style tokens
const card: React.CSSProperties = { background:C.white, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' };
const inp: React.CSSProperties = { padding:'9px 12px', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, color:C.text, outline:'none', width:'100%' };
const sel: React.CSSProperties = { ...inp, background:C.white, cursor:'pointer' };
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

const SectionHead = ({t}:{t:string}) => (
  <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:14 }}>{t}</div>
);

export const Patients = () => {
  const [view, setView] = useState<View>('list');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sf, setSf] = useState('');
  const [loading, setLoading] = useState(false);
  const [sel2, setSel] = useState<Patient|null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const user = JSON.parse(localStorage.getItem('user')||'{}');
  const name = user.fullName||'Doctor';
  const av = name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getPatients({search,status:sf||undefined,page,limit:10}); setPatients(r.data.data); setTotal(r.data.total); }
    catch { setErr('Error loading patients'); }
    finally { setLoading(false); }
  },[search,sf,page]);

  useEffect(()=>{load();},[load]);

  const openCreate = ()=>{ setForm(emptyForm); setErr(''); setView('create'); };
  const openDetail = async(id:string)=>{ try{ const r=await getPatient(id); setSel(r.data); setView('detail'); }catch{ setErr('Error'); }};
  const openEdit = (p:Patient)=>{ setSel(p); setForm({firstName:p.firstName,lastName:p.lastName,dateOfBirth:p.dateOfBirth?.split('T')[0]||'',gender:p.gender,email:p.email,phone:p.phone||'',address:p.address||'',emergencyContactName:p.emergencyContactName||'',emergencyContactPhone:p.emergencyContactPhone||'',bloodType:p.bloodType||'',allergies:(p.allergies||[]).join(', '),chronicConditions:(p.chronicConditions||[]).join(', '),notes:p.notes||'',status:p.status}); setErr(''); setView('edit'); };
  const submit = async(e:React.FormEvent)=>{ 
    e.preventDefault(); 
    setErr('');
    // Validar que la fecha de nacimiento no sea futura
    if (form.dateOfBirth) {
      const birth = new Date(form.dateOfBirth);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (birth > today) {
        setErr('Date of birth cannot be a future date.');
        return;
      }
    }
    setSaving(true); 
    const pay={...form,allergies:form.allergies?form.allergies.split(',').map((s:string)=>s.trim()):[],chronicConditions:form.chronicConditions?form.chronicConditions.split(',').map((s:string)=>s.trim()):[]}; 
    try{ 
      if(view==='create') await createPatient(pay as any); 
      else if(sel2) await updatePatient(sel2._id,pay as any); 
      await load(); 
      setView('list'); 
    }catch(e:any){ 
      setErr(e?.response?.data?.message||'Error'); 
    }finally{ 
      setSaving(false); 
    }
  };
  const del = async(id:string)=>{ if(!confirm('Delete?')) return; try{ await deletePatient(id); await load(); setView('list'); }catch{ setErr('Error'); }};

  const pages = Math.ceil(total/10);
  const NAV_ICONS: Record<string, React.ReactElement> = {
    Dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    Patients:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    Appointments: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    Messages:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    Pharmacy:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>,
    Settings:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  };

  const navL = (to:string,label:string,active=false) => (
    <Link to={to} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,fontSize:14,color:active?C.primary:C.sub,textDecoration:'none',background:active?C.primaryBg:'transparent',fontWeight:active?600:400 }}>
      <span style={{ color:active?C.primary:'#94a3b8',display:'flex',alignItems:'center',flexShrink:0 }}>{NAV_ICONS[label]}</span>
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
        {navL('/patients','Patients',true)}
        {navL('/appointments','Appointments')}
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

  const Topbar = ({title,sub}:{title:string;sub?:string})=>(
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
      <div><h1 style={{ fontSize:22,fontWeight:700,color:C.text,margin:0 }}>{title}</h1>{sub&&<p style={{ fontSize:13,color:C.gray,marginTop:4 }}>{sub}</p>}</div>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <button style={{ background:C.white,border:'1px solid #e5e7eb',borderRadius:8,padding:'7px 10px',cursor:'pointer' }}>🔔</button>
        <div style={{ width:32,height:32,borderRadius:'50%',background:C.primary,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700 }}>{av}</div>
      </div>
    </div>
  );

  const FRow=({k,v}:{k:string,v:string})=>(
    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13,paddingBottom:10,borderBottom:'1px solid #f1f5f9' }}>
      <span style={{ color:C.muted }}>{k}</span><span style={{ textTransform:'capitalize' }}>{v}</span>
    </div>
  );

  // LIST
  if(view==='list') return (
    <div style={{ display:'flex',minHeight:'100vh',fontFamily:"'Inter',-apple-system,sans-serif",background:C.bg }}>
      <Sidebar/>
      <main style={{ flex:1,minWidth:0,padding:'28px 32px',background:C.bg }}>
        <Topbar title="Patients" sub="Manage patient records and medical histories."/>
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,background:C.white,border:'1px solid #e5e7eb',borderRadius:10,padding:'8px 12px',width:280 }}>
            <span>🔍</span>
            <input style={{ border:'none',outline:'none',flex:1,fontSize:13 }} placeholder="Search by name or email..." value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}/>
          </div>
          <select style={{ ...sel,width:'auto' }} value={sf} onChange={e=>{ setSf(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option><option value="inactive">Inactive</option>
            <option value="inpatient">In-Patient</option><option value="discharged">Discharged</option>
          </select>
          <button style={btnP} onClick={openCreate}>+ New Patient</button>
        </div>
        {err&&<div style={{ color:C.red,fontSize:13,background:C.redBg,padding:'10px 14px',borderRadius:8,marginBottom:12 }}>{err}</div>}
        <div style={{ ...card,padding:0,overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Patient','Contact','Age / Gender','Conditions','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading?<tr><td colSpan={6} style={{ textAlign:'center',padding:40,color:C.muted }}>Loading...</td></tr>
              :patients.length===0?<tr><td colSpan={6}>
                <div style={{ textAlign:'center',padding:'48px 24px' }}>
                  <div style={{ fontSize:40,marginBottom:12 }}>👤</div>
                  <div style={{ fontSize:16,fontWeight:600,color:'#374151',marginBottom:6 }}>No patients found</div>
                  <div style={{ fontSize:13,color:C.muted,marginBottom:16 }}>Start by adding your first patient.</div>
                  <button style={btnP} onClick={openCreate}>+ Add Patient</button>
                </div>
              </td></tr>
              :patients.map(p=>(
                <tr key={p._id} onClick={()=>openDetail(p._id)} style={{ cursor:'pointer',borderBottom:'1px solid #f1f5f9' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{ padding:'14px 16px',verticalAlign:'middle' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                      <Avatar a={p.firstName} b={p.lastName}/>
                      <div>
                        <div style={{ fontWeight:600,color:C.text,fontSize:13 }}>{p.firstName} {p.lastName}</div>
                        <div style={{ fontSize:12,color:C.muted }}>{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13 }}>
                    <div>{p.phone||'—'}</div><div style={{ fontSize:11,color:C.muted }}>{p.address||'—'}</div>
                  </td>
                  <td style={{ padding:'14px 16px',verticalAlign:'middle',fontSize:13 }}>
                    <div>{p.dateOfBirth?`${calcAge(p.dateOfBirth)} yrs`:'—'}</div>
                    <div style={{ fontSize:11,color:C.muted,textTransform:'capitalize' }}>{p.gender}</div>
                  </td>
                  <td style={{ padding:'14px 16px',verticalAlign:'middle' }}>
                    {(p.chronicConditions||[]).slice(0,2).map((c,i)=><span key={i} style={{ background:C.grayBg,color:C.sub,padding:'2px 8px',borderRadius:4,fontSize:11,marginRight:4 }}>{c}</span>)}
                    {(p.chronicConditions||[]).length===0&&<span style={{ fontSize:11,color:C.muted }}>None</span>}
                  </td>
                  <td style={{ padding:'14px 16px',verticalAlign:'middle' }}><Badge s={p.status}/></td>
                  <td style={{ padding:'14px 16px',verticalAlign:'middle' }} onClick={e=>e.stopPropagation()}>
                    <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} onClick={()=>openEdit(p)}>✏️</button>
                    <button style={{ background:'transparent',border:'none',padding:'6px 8px',borderRadius:8,cursor:'pointer',fontSize:14 }} onClick={()=>del(p._id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages>1&&(
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginTop:16,fontSize:13,color:C.gray }}>
            <button style={btnG} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <span>Page {page} of {pages} · {total} patients</span>
            <button style={btnG} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        )}
      </main>
    </div>
  );

  // DETAIL
  if(view==='detail'&&sel2) return (
    <div style={{ display:'flex',minHeight:'100vh',fontFamily:"'Inter',-apple-system,sans-serif",background:C.bg }}>
      <Sidebar/>
      <main style={{ flex:1,minWidth:0,padding:'28px 32px' }}>
        <Topbar title="Patient Profile"/>
        <button style={{ ...btnG,marginBottom:16 }} onClick={()=>setView('list')}>← Back to Patients</button>
        <div style={{ display:'grid',gridTemplateColumns:'300px 1fr',gap:16,alignItems:'start' }}>
          <div style={card}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:20,textAlign:'center' }}>
              <Avatar a={sel2.firstName} b={sel2.lastName} size={72} bg="#dbeafe"/>
              <h2 style={{ fontSize:18,color:C.text,margin:0 }}>{sel2.firstName} {sel2.lastName}</h2>
              <Badge s={sel2.status}/>
            </div>
            <FRow k="Date of Birth" v={sel2.dateOfBirth?new Date(sel2.dateOfBirth).toLocaleDateString():'—'}/>
            <FRow k="Age" v={sel2.dateOfBirth?`${calcAge(sel2.dateOfBirth)} years`:'—'}/>
            <FRow k="Gender" v={sel2.gender}/>
            <FRow k="Blood Type" v={sel2.bloodType||'—'}/>
            <div style={{ fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',margin:'12px 0 8px' }}>Contact</div>
            <FRow k="Email" v={sel2.email}/><FRow k="Phone" v={sel2.phone||'—'}/><FRow k="Address" v={sel2.address||'—'}/>
            <div style={{ display:'flex',gap:8,marginTop:16 }}>
              <button style={{ ...btnP,flex:1 }} onClick={()=>openEdit(sel2)}>Edit Patient</button>
              <button style={btnD} onClick={()=>del(sel2._id)}>Delete</button>
            </div>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <div style={card}>
              <h3 style={{ fontSize:15,fontWeight:600,marginBottom:12 }}>Allergies</h3>
              {(sel2.allergies||[]).length>0
                ?<div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>{sel2.allergies!.map((a,i)=><span key={i} style={{ background:C.redBg,color:C.red,padding:'2px 8px',borderRadius:4,fontSize:11 }}>{a}</span>)}</div>
                :<p style={{ fontSize:13,color:C.muted }}>No known allergies</p>}
              <h3 style={{ fontSize:15,fontWeight:600,margin:'14px 0 8px' }}>Chronic Conditions</h3>
              {(sel2.chronicConditions||[]).length>0
                ?<div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>{sel2.chronicConditions!.map((c,i)=><span key={i} style={{ background:C.orangeBg,color:C.orange,padding:'2px 8px',borderRadius:4,fontSize:11 }}>{c}</span>)}</div>
                :<p style={{ fontSize:13,color:C.muted }}>No chronic conditions</p>}
            </div>
            <div style={card}>
              <h3 style={{ fontSize:15,fontWeight:600,marginBottom:8 }}>Clinical Notes</h3>
              <p style={{ fontSize:13,color:'#475569',lineHeight:1.6 }}>{sel2.notes||'No clinical notes recorded.'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // FORM (create / edit)
  return (
    <div style={{ display:'flex',minHeight:'100vh',fontFamily:"'Inter',-apple-system,sans-serif",background:C.bg }}>
      <Sidebar/>
      <main style={{ flex:1,minWidth:0,padding:'28px 32px' }}>
        <Topbar title={view==='create'?'New Patient':'Edit Patient'}/>
        <button style={{ ...btnG,marginBottom:16 }} onClick={()=>setView(sel2?'detail':'list')}>← Back</button>
        <form style={{ ...card,maxWidth:800 }} onSubmit={submit}>
          {err&&<div style={{ color:C.red,fontSize:13,background:C.redBg,padding:'10px 14px',borderRadius:8,marginBottom:16 }}>{err}</div>}
          {[
            { title:'Personal Identity', fields:[
              {l:'First Name *',k:'firstName',req:true,ph:'e.g. John'},{l:'Last Name *',k:'lastName',req:true,ph:'e.g. Doe'},
              {l:'Date of Birth *',k:'dateOfBirth',req:true,type:'date',max:new Date().toISOString().split('T')[0]},{l:'Gender *',k:'gender',req:true,type:'select',opts:[['','Select gender'],['male','Male'],['female','Female'],['other','Other']]},
            ]},
            { title:'Contact Information', fields:[
              {l:'Email *',k:'email',req:true,type:'email',ph:'patient@email.com'},{l:'Phone',k:'phone',ph:'+57 300 000 0000'},
              {l:'Address',k:'address',ph:'Street, City, Country',span:true},
            ]},
            { title:'Emergency Contact', fields:[
              {l:'Name',k:'emergencyContactName',ph:'Next of kin'},{l:'Phone',k:'emergencyContactPhone',ph:'+57 300 000 0000'},
            ]},
            { title:'Clinical Profile', fields:[
              {l:'Blood Type',k:'bloodType',type:'select',opts:[['','Unknown'],...BLOOD_TYPES.map(b=>[b,b])]},
              {l:'Status',k:'status',type:'select',opts:[['active','Active'],['inactive','Inactive'],['inpatient','In-Patient'],['discharged','Discharged']]},
              {l:'Allergies (comma separated)',k:'allergies',ph:'Penicillin, Aspirin...',span:true},
              {l:'Chronic Conditions (comma separated)',k:'chronicConditions',ph:'Hypertension, Diabetes...',span:true},
              {l:'Clinical Notes',k:'notes',type:'textarea',ph:'Additional notes...',span:true},
            ]},
          ].map(section=>(
            <div key={section.title} style={{ marginBottom:24,paddingBottom:20,borderBottom:'1px solid #f1f5f9' }}>
              <SectionHead t={section.title}/>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                {section.fields.map((f:any)=>(
                  <label key={f.k} style={{ display:'flex',flexDirection:'column',gap:6,...(f.span?{gridColumn:'1 / -1'}:{}) }}>
                    <span style={{ fontSize:12,fontWeight:500,color:'#374151' }}>{f.l}</span>
                    {f.type==='select'?(
                      <select style={sel} required={f.req} value={(form as any)[f.k]} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}>
                        {f.opts.map(([v,t]:string[])=><option key={v} value={v}>{t}</option>)}
                      </select>
                    ):f.type==='textarea'?(
                      <textarea style={{ ...inp,resize:'vertical' }} rows={3} value={(form as any)[f.k]} placeholder={f.ph} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}/>
                    ):(
                      <input style={inp} type={f.type||'text'} required={f.req} value={(form as any)[f.k]} placeholder={f.ph} max={f.max} onChange={e=>setForm((p:any)=>({...p,[f.k]:e.target.value}))}/>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
            <button type="button" style={btnG} onClick={()=>setView(sel2?'detail':'list')}>Cancel</button>
            <button type="submit" style={btnP} disabled={saving}>{saving?'Saving...':view==='create'?'Create Patient':'Save Changes'}</button>
          </div>
        </form>
      </main>
    </div>
  );
};