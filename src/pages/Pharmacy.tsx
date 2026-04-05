import { useState, useEffect, useCallback } from 'react';
import {
  getPrescriptions, createPrescription, updatePrescription, deletePrescription,
  type Prescription,
} from '../services/prescriptions.service';
import { getPatients } from '../services/patient.service';

const C = {
  primary:'#137fec', white:'#fff', bg:'#f6f7f8', border:'#e5e7eb', borderL:'#f1f5f9',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8', gray:'#64748b',
  green:'#16a34a', greenBg:'#dcfce7', red:'#dc2626', redBg:'#fee2e2',
  blue:'#2563eb', blueBg:'#dbeafe', yellow:'#d97706', yellowBg:'#fef3c7',
};
const STATUS_LABEL: Record<string,string> = { active:'Activa', expired:'Vencida', cancelled:'Cancelada' };
const STATUS_COLOR: Record<string,[string,string]> = {
  active:[C.greenBg,C.green], expired:[C.yellowBg,C.yellow], cancelled:[C.redBg,C.red],
};
const ROUTES: Record<string,string> = {
  oral:'Oral', intravenous:'Intravenosa', intramuscular:'Intramuscular',
  subcutaneous:'Subcutánea', topical:'Tópica', inhaled:'Inhalada', other:'Otra',
};
const UNITS     = ['mg','ml','g','mcg','UI','comprimidos','gotas','parches'];
const FREQS     = ['1x al día','2x al día','3x al día','Cada 6 horas','Cada 8 horas','Cada 12 horas','Según necesidad'];
const DURATIONS = ['3 días','5 días','7 días','10 días','14 días','1 mes','3 meses','Indefinido'];

function patName(p: Prescription['patientId']): string {
  if (typeof p==='object'&&p) return `${(p as any).firstName} ${(p as any).lastName}`; return 'Desconocido';
}
function getInitials(n=''){return n.split(' ').filter(Boolean).slice(0,2).map((w:string)=>w[0]?.toUpperCase()).join('');}

const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', background:C.white };
const btnP: React.CSSProperties = { background:C.primary, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' };
const btnG: React.CSSProperties = { background:'transparent', color:C.sub, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 18px', fontSize:13, cursor:'pointer' };
const EMPTY_FORM = { patientId:'', appointmentId:'', medication:'', dosage:'', unit:'mg', frequency:'1x al día', duration:'7 días', route:'oral', instructions:'', status:'active' };

const css = `
  .ph-wrap{padding:28px 32px;background:${C.bg};min-height:100vh;font-family:'Inter',-apple-system,sans-serif}
  .ph-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
  .ph-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:center}
  .ph-search{display:flex;align-items:center;gap:8px;background:${C.white};border:1px solid ${C.border};border-radius:10px;padding:8px 12px;flex:1;min-width:200px;max-width:340px}
  .ph-search input{flex:1;font-size:13px;color:${C.sub};border:none;outline:none;background:transparent}
  .ph-sel{padding:8px 12px;border:1px solid ${C.border};border-radius:10px;font-size:13px;color:${C.sub};background:${C.white};outline:none;cursor:pointer}
  .ph-card{background:${C.white};border-radius:14px;border:1px solid ${C.border};box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden}
  .ph-thead{display:grid;grid-template-columns:1fr 110px 100px 130px 100px 76px;padding:10px 20px;background:#f8fafc;border-bottom:1px solid ${C.borderL}}
  .ph-trow{display:grid;grid-template-columns:1fr 110px 100px 130px 100px 76px;padding:13px 20px;align-items:center;border-bottom:1px solid ${C.borderL};cursor:pointer;transition:background .12s}
  .ph-trow:hover{background:#f8fafc}.ph-trow:last-child{border-bottom:none}
  .ph-badge{display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px}
  .ph-ibt{padding:5px;border:none;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:transparent;transition:background .12s}
  .ph-ibt:hover{background:${C.bg}}
  .ph-ov{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
  .ph-modal{background:${C.white};border-radius:16px;width:100%;max-width:620px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2)}
  .ph-mhead{padding:20px 24px;border-bottom:1px solid ${C.border};display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:${C.white};z-index:1}
  .ph-mbody{padding:24px;display:flex;flex-direction:column;gap:16px}
  .ph-mfoot{padding:16px 24px;border-top:1px solid ${C.border};display:flex;justify-content:flex-end;gap:10px}
  .ph-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .ph-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
  .ph-dg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:900px){.ph-thead{display:none}.ph-trow{grid-template-columns:1fr !important;gap:4px;padding:12px 16px}}
  @media(max-width:768px){.ph-wrap{padding:16px}.ph-g2{grid-template-columns:1fr}.ph-g3{grid-template-columns:1fr 1fr}.ph-dg{grid-template-columns:1fr}}
  @media(max-width:480px){.ph-g3{grid-template-columns:1fr}}
`;
const Lbl=({children}:{children:React.ReactNode})=>(
  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:5}}>{children}</label>
);
const Sk=({w='100%',h=14}:{w?:string|number;h?:number})=>(
  <div style={{width:w,height:h,borderRadius:5,background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>
);
type ModalMode='create'|'edit'|'detail'|null;

export const Pharmacy = () => {
  const [prescriptions,setPrescriptions]=useState<Prescription[]>([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [search,setSearch]=useState('');
  const [filterStatus,setFilterStatus]=useState('');
  const [modalMode,setModalMode]=useState<ModalMode>(null);
  const [selected,setSelected]=useState<Prescription|null>(null);
  const [form,setForm]=useState<Record<string,any>>(EMPTY_FORM);
  const [patients,setPatients]=useState<any[]>([]);
  const [saving,setSaving]=useState(false);
  const [formError,setFormError]=useState('');
  const LIMIT=20;

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const res=await getPrescriptions({page,limit:LIMIT,status:filterStatus||undefined});setPrescriptions(res.data.data);setTotal(res.data.total);}
    catch{setError('Error al cargar las prescripciones.');}
    finally{setLoading(false);}
  },[page,filterStatus]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(modalMode==='create'||modalMode==='edit')getPatients({limit:200}).then(r=>setPatients(r.data.data??[])).catch(()=>{});},[modalMode]);

  const filtered=prescriptions.filter(p=>!search||p.medication.toLowerCase().includes(search.toLowerCase())||patName(p.patientId).toLowerCase().includes(search.toLowerCase()));
  const openCreate=()=>{setForm(EMPTY_FORM);setFormError('');setModalMode('create');};
  const openEdit=(p:Prescription)=>{setSelected(p);setForm({patientId:typeof p.patientId==='object'?(p.patientId as any)._id:p.patientId,appointmentId:typeof p.appointmentId==='object'?(p.appointmentId as any)?._id??'':p.appointmentId??'',medication:p.medication,dosage:p.dosage,unit:p.unit,frequency:p.frequency,duration:p.duration,route:p.route,instructions:p.instructions,status:p.status});setFormError('');setModalMode('edit');};
  const openDetail=(p:Prescription)=>{setSelected(p);setModalMode('detail');};
  const closeModal=()=>{setModalMode(null);setSelected(null);};
  const handleSave=async()=>{
    setFormError('');
    if(!form.patientId){setFormError('Selecciona un paciente.');return;}
    if(!form.medication.trim()){setFormError('Ingresa el nombre del medicamento.');return;}
    if(!form.dosage||+form.dosage<=0){setFormError('La dosis debe ser mayor a 0.');return;}
    setSaving(true);
    try{const payload={...form,dosage:+form.dosage,appointmentId:form.appointmentId||undefined};if(modalMode==='create')await createPrescription(payload);else if(modalMode==='edit'&&selected)await updatePrescription(selected._id,payload);closeModal();load();}
    catch(err:any){setFormError(err?.response?.data?.message??'Error al guardar.');}
    finally{setSaving(false);}
  };
  const handleDelete=async(id:string)=>{if(!confirm('¿Cancelar esta prescripción?'))return;try{await deletePrescription(id);load();}catch{alert('Error al cancelar.');}};
  const totalPages=Math.ceil(total/LIMIT);

  return(
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}\n${css}`}</style>
      <div className="ph-wrap">
        <div className="ph-topbar">
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:0}}>Prescripciones</h1>
            <p style={{fontSize:13,color:C.muted,marginTop:4}}>Gestión de prescripciones médicas.</p>
          </div>
          <button style={btnP} onClick={openCreate}>+ Nueva Prescripción</button>
        </div>
        <div className="ph-filters">
          <div className="ph-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={C.muted} strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/></svg>
            <input placeholder="Buscar medicamento o paciente..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="ph-sel" value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}}>
            <option value="">Todos los estados</option><option value="active">Activas</option><option value="expired">Vencidas</option><option value="cancelled">Canceladas</option>
          </select>
          <span style={{fontSize:13,color:C.muted,marginLeft:'auto'}}>{total} prescripción{total!==1?'es':''}</span>
        </div>
        {error&&<div style={{background:C.redBg,color:C.red,padding:'10px 14px',borderRadius:8,fontSize:13,marginBottom:16}}>{error}</div>}
        <div className="ph-card">
          <div className="ph-thead">{['MEDICAMENTO / PACIENTE','DOSIS','VÍA','FRECUENCIA','ESTADO','ACCIONES'].map(h=><span key={h} style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'0.05em'}}>{h}</span>)}</div>
          {loading?([1,2,3,4,5].map(i=><div key={i} className="ph-trow" style={{cursor:'default'}}><div><Sk w={160}/><div style={{marginTop:5}}><Sk w={100} h={12}/></div></div><Sk w={60}/><Sk w={80}/><Sk w={90}/><Sk w={70}/><Sk w={60}/></div>))
          :filtered.length===0?(<div style={{textAlign:'center',padding:'48px 24px',color:C.muted,fontSize:14}}><div style={{fontSize:40,marginBottom:8}}>💊</div>No hay prescripciones{filterStatus?` con estado "${STATUS_LABEL[filterStatus]??filterStatus}"`:''}.</div>)
          :(filtered.map(p=>{const[sBg,sC]=STATUS_COLOR[p.status]??['#f1f5f9',C.gray];return(
            <div key={p._id} className="ph-trow" onClick={()=>openDetail(p)}>
              <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:32,height:32,borderRadius:8,background:C.blueBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span className="material-symbols-outlined" style={{fontSize:16,color:C.blue}}>medication</span></div><div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{p.medication}</div><div style={{fontSize:12,color:C.muted}}>{patName(p.patientId)}</div></div></div>
              <span style={{fontSize:13,color:C.sub}}>{p.dosage} {p.unit}</span>
              <span style={{fontSize:13,color:C.sub}}>{ROUTES[p.route]??p.route}</span>
              <span style={{fontSize:13,color:C.sub}}>{p.frequency}</span>
              <span className="ph-badge" style={{background:sBg,color:sC}}>{STATUS_LABEL[p.status]??p.status}</span>
              <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                <button className="ph-ibt" title="Editar" onClick={()=>openEdit(p)}><span className="material-symbols-outlined" style={{fontSize:16,color:C.blue}}>edit</span></button>
                {p.status!=='cancelled'&&<button className="ph-ibt" title="Cancelar" onClick={()=>handleDelete(p._id)}><span className="material-symbols-outlined" style={{fontSize:16,color:C.red}}>delete</span></button>}
              </div>
            </div>
          );}))
          }
        </div>
        {totalPages>1&&<div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16}}><button style={{...btnG,padding:'7px 16px'}} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Anterior</button><span style={{fontSize:13,color:C.muted,alignSelf:'center'}}>{page}/{totalPages}</span><button style={{...btnG,padding:'7px 16px'}} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Siguiente →</button></div>}
      </div>

      {/* Modal Crear/Editar */}
      {(modalMode==='create'||modalMode==='edit')&&(
        <div className="ph-ov" onClick={closeModal}><div className="ph-modal" onClick={e=>e.stopPropagation()}>
          <div className="ph-mhead"><h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:0}}>{modalMode==='create'?'💊 Nueva Prescripción':'✏️ Editar Prescripción'}</h2><button onClick={closeModal} style={{background:'none',border:'none',cursor:'pointer',color:C.muted}}><span className="material-symbols-outlined">close</span></button></div>
          <div className="ph-mbody">
            <div><Lbl>Paciente *</Lbl><select style={{...inp,cursor:'pointer'}} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))}><option value="">Selecciona un paciente...</option>{patients.map(p=><option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}</select></div>
            <div><Lbl>Medicamento *</Lbl><input style={inp} type="text" placeholder="ej. Amoxicilina" value={form.medication} onChange={e=>setForm(f=>({...f,medication:e.target.value}))}/></div>
            <div className="ph-g3">
              <div><Lbl>Dosis *</Lbl><input style={inp} type="number" min="0.01" step="0.01" placeholder="500" value={form.dosage} onChange={e=>setForm(f=>({...f,dosage:e.target.value}))}/></div>
              <div><Lbl>Unidad</Lbl><select style={{...inp,cursor:'pointer'}} value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>{UNITS.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
              <div><Lbl>Vía</Lbl><select style={{...inp,cursor:'pointer'}} value={form.route} onChange={e=>setForm(f=>({...f,route:e.target.value}))}>{Object.entries(ROUTES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
            </div>
            <div className="ph-g2">
              <div><Lbl>Frecuencia *</Lbl><select style={{...inp,cursor:'pointer'}} value={form.frequency} onChange={e=>setForm(f=>({...f,frequency:e.target.value}))}>{FREQS.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
              <div><Lbl>Duración *</Lbl><select style={{...inp,cursor:'pointer'}} value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))}>{DURATIONS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
            </div>
            <div><Lbl>Instrucciones / Notas</Lbl><textarea style={{...inp,resize:'vertical',minHeight:72} as React.CSSProperties} placeholder="ej. Tomar con alimentos..." value={form.instructions} onChange={e=>setForm(f=>({...f,instructions:e.target.value}))}/></div>
            {modalMode==='edit'&&<div><Lbl>Estado</Lbl><select style={{...inp,cursor:'pointer'}} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option value="active">Activa</option><option value="expired">Vencida</option><option value="cancelled">Cancelada</option></select></div>}
            {formError&&<div style={{display:'flex',gap:8,alignItems:'center',background:C.redBg,color:C.red,padding:'9px 13px',borderRadius:8,fontSize:13}}><span className="material-symbols-outlined" style={{fontSize:16}}>error</span>{formError}</div>}
          </div>
          <div className="ph-mfoot"><button style={btnG} onClick={closeModal}>Cancelar</button><button style={btnP} onClick={handleSave} disabled={saving}>{saving?'Guardando...':modalMode==='create'?'Crear Prescripción':'Guardar Cambios'}</button></div>
        </div></div>
      )}

      {/* Modal Detalle */}
      {modalMode==='detail'&&selected&&(()=>{
        const[sBg,sC]=STATUS_COLOR[selected.status]??['#f1f5f9',C.gray];
        const pat=typeof selected.patientId==='object'?selected.patientId as any:null;
        return(
          <div className="ph-ov" onClick={closeModal}><div className="ph-modal" onClick={e=>e.stopPropagation()}>
            <div className="ph-mhead">
              <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:36,height:36,borderRadius:10,background:C.blueBg,display:'flex',alignItems:'center',justifyContent:'center'}}><span className="material-symbols-outlined" style={{fontSize:20,color:C.blue}}>medication</span></div><div><div style={{fontSize:16,fontWeight:700,color:C.text}}>{selected.medication}</div><span className="ph-badge" style={{background:sBg,color:sC}}>{STATUS_LABEL[selected.status]}</span></div></div>
              <button onClick={closeModal} style={{background:'none',border:'none',cursor:'pointer',color:C.muted}}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="ph-mbody">
              {pat&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:C.blueBg,borderRadius:10}}><div style={{width:36,height:36,borderRadius:'50%',background:C.primary,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0}}>{getInitials(`${pat.firstName} ${pat.lastName}`)}</div><div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{pat.firstName} {pat.lastName}</div><div style={{fontSize:12,color:C.muted}}>Paciente</div></div></div>}
              <div className="ph-dg">{[{label:'Dosis',value:`${selected.dosage} ${selected.unit}`},{label:'Vía',value:ROUTES[selected.route]??selected.route},{label:'Frecuencia',value:selected.frequency},{label:'Duración',value:selected.duration}].map(({label,value})=><div key={label} style={{background:'#f8fafc',borderRadius:8,padding:'10px 14px'}}><div style={{fontSize:11,color:C.muted,marginBottom:3}}>{label}</div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{value}</div></div>)}</div>
              {selected.instructions&&<div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'12px 14px'}}><div style={{fontSize:11,color:C.yellow,fontWeight:600,marginBottom:4}}>INSTRUCCIONES</div><div style={{fontSize:13,color:C.sub}}>{selected.instructions}</div></div>}
              <div style={{fontSize:12,color:C.muted,textAlign:'right'}}>Creada: {new Date(selected.createdAt).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}</div>
            </div>
            <div className="ph-mfoot"><button style={btnG} onClick={closeModal}>Cerrar</button><button style={btnP} onClick={()=>openEdit(selected)}>Editar</button></div>
          </div></div>
        );
      })()}
    </>
  );
};

export default Pharmacy;