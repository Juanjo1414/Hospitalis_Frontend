import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000' });
API.interceptors.request.use(c => { const t = localStorage.getItem('accessToken'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

interface Medication { _id: string; name: string; description: string; genericName: string; category: string; defaultUnit: string; status: 'active' | 'inactive'; }
const getMedications   = (p?: any) => API.get<{ data: Medication[]; total: number }>('/medications', { params: p });
const createMedication = (d: any)  => API.post<Medication>('/medications', d);
const updateMedication = (id: string, d: any) => API.patch<Medication>(`/medications/${id}`, d);
const deleteMedication = (id: string) => API.delete(`/medications/${id}`);

function getRole() {
  const t = localStorage.getItem('accessToken'); if (!t) return '';
  try { const b = t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'); return JSON.parse(decodeURIComponent(Array.from(atob(b)).map((c:string)=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join(''))).role??''; }
  catch { return ''; }
}

const C = {
  primary:'#137fec', white:'#fff', bg:'#f6f7f8', border:'#e5e7eb', borderL:'#f1f5f9',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8', gray:'#64748b',
  green:'#16a34a', greenBg:'#dcfce7', red:'#dc2626', redBg:'#fee2e2',
  blue:'#2563eb', blueBg:'#dbeafe',
};
const STATUS_COLOR: Record<string,[string,string]> = { active:[C.greenBg,C.green], inactive:['#f1f5f9',C.gray] };
const STATUS_LBL: Record<string,string> = { active:'Activo', inactive:'Inactivo' };
const UNITS = ['mg','ml','g','mcg','UI','comprimidos','gotas','parches'];
const CATS  = ['Analgésico','Antibiótico','Antihipertensivo','Antidiabético','Antiinflamatorio','Cardiovascular','Gastrointestinal','Neurológico','Psiquiátrico','Vitamina','Otro'];

const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', background:C.white };
const btnP: React.CSSProperties = { background:C.primary, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' };
const btnG: React.CSSProperties = { background:'transparent', color:C.sub, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 18px', fontSize:13, cursor:'pointer' };
const EMPTY = { name:'', description:'', genericName:'', category:'', defaultUnit:'mg', status:'active' };

const css = `
  .md-wrap{padding:28px 32px;background:${C.bg};min-height:100vh;font-family:'Inter',-apple-system,sans-serif}
  .md-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
  .md-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:center}
  .md-search{display:flex;align-items:center;gap:8px;background:${C.white};border:1px solid ${C.border};border-radius:10px;padding:8px 12px;flex:1;min-width:200px;max-width:340px}
  .md-search input{flex:1;font-size:13px;color:${C.sub};border:none;outline:none;background:transparent}
  .md-sel{padding:8px 12px;border:1px solid ${C.border};border-radius:10px;font-size:13px;color:${C.sub};background:${C.white};outline:none;cursor:pointer}
  .md-card{background:${C.white};border-radius:14px;border:1px solid ${C.border};box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden}
  .md-thead{display:grid;grid-template-columns:1fr 130px 110px 100px 76px;padding:10px 20px;background:#f8fafc;border-bottom:1px solid ${C.borderL}}
  .md-trow{display:grid;grid-template-columns:1fr 130px 110px 100px 76px;padding:13px 20px;align-items:center;border-bottom:1px solid ${C.borderL};cursor:pointer;transition:background .12s}
  .md-trow:hover{background:#f8fafc}.md-trow:last-child{border-bottom:none}
  .md-badge{display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px}
  .md-ibt{padding:5px;border:none;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:transparent;transition:background .12s}
  .md-ibt:hover{background:${C.bg}}
  .md-ov{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
  .md-modal{background:${C.white};border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2)}
  .md-mhead{padding:20px 24px;border-bottom:1px solid ${C.border};display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:${C.white};z-index:1}
  .md-mbody{padding:24px;display:flex;flex-direction:column;gap:16px}
  .md-mfoot{padding:16px 24px;border-top:1px solid ${C.border};display:flex;justify-content:flex-end;gap:10px}
  .md-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .md-dg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .md-access-denied{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:12px}
  @media(max-width:900px){.md-thead{display:none}.md-trow{grid-template-columns:1fr !important;gap:4px;padding:12px 16px}}
  @media(max-width:768px){.md-wrap{padding:16px}.md-g2{grid-template-columns:1fr}.md-dg{grid-template-columns:1fr}}
`;
const Lbl=({children}:{children:React.ReactNode})=>(
  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:5}}>{children}</label>
);
const Sk=({w='100%',h=14}:{w?:string|number;h?:number})=>(
  <div style={{width:w,height:h,borderRadius:5,background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>
);
type ModalMode='create'|'edit'|'detail'|null;

export const Medications = () => {
  const isAdmin = getRole()==='admin';
  const [meds,setMeds]=useState<Medication[]>([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [search,setSearch]=useState('');
  const [filterStatus,setFilterStatus]=useState('');
  const [modalMode,setModalMode]=useState<ModalMode>(null);
  const [selected,setSelected]=useState<Medication|null>(null);
  const [form,setForm]=useState<Record<string,any>>(EMPTY);
  const [saving,setSaving]=useState(false);
  const [formError,setFormError]=useState('');
  const LIMIT=25;

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const res=await getMedications({page,limit:LIMIT,status:filterStatus||undefined,search:search||undefined});setMeds(res.data.data);setTotal(res.data.total);}
    catch{setError('Error al cargar el catálogo.');}
    finally{setLoading(false);}
  },[page,filterStatus,search]);
  useEffect(()=>{const t=setTimeout(()=>load(),search?350:0);return()=>clearTimeout(t);},[load,search]);

  const openCreate=()=>{setForm(EMPTY);setFormError('');setModalMode('create');};
  const openEdit=(m:Medication)=>{setSelected(m);setForm({name:m.name,description:m.description,genericName:m.genericName,category:m.category,defaultUnit:m.defaultUnit,status:m.status});setFormError('');setModalMode('edit');};
  const openDetail=(m:Medication)=>{setSelected(m);setModalMode('detail');};
  const closeModal=()=>{setModalMode(null);setSelected(null);};
  const handleSave=async()=>{
    setFormError('');
    if(!form.name.trim()){setFormError('El nombre del medicamento es obligatorio.');return;}
    setSaving(true);
    try{if(modalMode==='create')await createMedication(form);else if(modalMode==='edit'&&selected)await updateMedication(selected._id,form);closeModal();load();}
    catch(err:any){setFormError(err?.response?.data?.message??'Error al guardar.');}
    finally{setSaving(false);}
  };
  const handleDelete=async(id:string)=>{if(!confirm('¿Eliminar este medicamento del catálogo?'))return;try{await deleteMedication(id);load();}catch{alert('Error al eliminar.');}};
  const totalPages=Math.ceil(total/LIMIT);

  return(
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}\n${css}`}</style>
      <div className="md-wrap">
        <div className="md-topbar">
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:0}}>Catálogo de Medicamentos</h1>
            <p style={{fontSize:13,color:C.muted,marginTop:4}}>Inventario de medicamentos disponibles en el sistema.</p>
          </div>
          {isAdmin&&<button style={btnP} onClick={openCreate}>+ Agregar Medicamento</button>}
        </div>

        {!isAdmin&&<div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:'10px 14px',fontSize:13,color:C.blue,marginBottom:16,display:'flex',gap:8,alignItems:'center'}}><span className="material-symbols-outlined" style={{fontSize:16}}>info</span>Solo los administradores pueden agregar, editar o eliminar medicamentos del catálogo.</div>}

        <div className="md-filters">
          <div className="md-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={C.muted} strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/></svg>
            <input placeholder="Buscar por nombre..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="md-sel" value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}}>
            <option value="">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option>
          </select>
          <span style={{fontSize:13,color:C.muted,marginLeft:'auto'}}>{total} medicamento{total!==1?'s':''}</span>
        </div>

        {error&&<div style={{background:C.redBg,color:C.red,padding:'10px 14px',borderRadius:8,fontSize:13,marginBottom:16}}>{error}</div>}

        <div className="md-card">
          <div className="md-thead">{['NOMBRE','CATEGORÍA','UNIDAD DEFECTO','ESTADO','ACCIONES'].map(h=><span key={h} style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'0.05em'}}>{h}</span>)}</div>
          {loading?([1,2,3,4,5].map(i=><div key={i} className="md-trow" style={{cursor:'default'}}><div><Sk w={160}/><div style={{marginTop:5}}><Sk w={100} h={12}/></div></div><Sk w={90}/><Sk w={60}/><Sk w={70}/><Sk w={60}/></div>))
          :meds.length===0?(<div style={{textAlign:'center',padding:'48px 24px',color:C.muted,fontSize:14}}><div style={{fontSize:40,marginBottom:8}}>🏥</div>No hay medicamentos en el catálogo{filterStatus?` con estado "${STATUS_LBL[filterStatus]??filterStatus}"`:''}.</div>)
          :(meds.map(m=>{const[sBg,sC]=STATUS_COLOR[m.status]??['#f1f5f9',C.gray];return(
            <div key={m._id} className="md-trow" onClick={()=>openDetail(m)}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:32,height:32,borderRadius:8,background:'#f0fdf4',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span className="material-symbols-outlined" style={{fontSize:16,color:C.green}}>local_pharmacy</span></div>
                <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{m.name}</div>{m.genericName&&<div style={{fontSize:12,color:C.muted}}>{m.genericName}</div>}</div>
              </div>
              <span style={{fontSize:13,color:C.sub}}>{m.category||'—'}</span>
              <span style={{fontSize:13,color:C.sub}}>{m.defaultUnit||'—'}</span>
              <span className="md-badge" style={{background:sBg,color:sC}}>{STATUS_LBL[m.status]??m.status}</span>
              {isAdmin&&<div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                <button className="md-ibt" title="Editar" onClick={()=>openEdit(m)}><span className="material-symbols-outlined" style={{fontSize:16,color:C.blue}}>edit</span></button>
                <button className="md-ibt" title="Eliminar" onClick={()=>handleDelete(m._id)}><span className="material-symbols-outlined" style={{fontSize:16,color:C.red}}>delete</span></button>
              </div>}
            </div>
          );}))
          }
        </div>
        {totalPages>1&&<div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16}}><button style={{...btnG,padding:'7px 16px'}} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Anterior</button><span style={{fontSize:13,color:C.muted,alignSelf:'center'}}>{page}/{totalPages}</span><button style={{...btnG,padding:'7px 16px'}} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Siguiente →</button></div>}
      </div>

      {/* Modal Crear/Editar */}
      {(modalMode==='create'||modalMode==='edit')&&(
        <div className="md-ov" onClick={closeModal}><div className="md-modal" onClick={e=>e.stopPropagation()}>
          <div className="md-mhead"><h2 style={{fontSize:16,fontWeight:700,color:C.text,margin:0}}>{modalMode==='create'?'🏥 Nuevo Medicamento':'✏️ Editar Medicamento'}</h2><button onClick={closeModal} style={{background:'none',border:'none',cursor:'pointer',color:C.muted}}><span className="material-symbols-outlined">close</span></button></div>
          <div className="md-mbody">
            <div><Lbl>Nombre del medicamento *</Lbl><input style={inp} type="text" placeholder="ej. Amoxicilina" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div><Lbl>Nombre genérico</Lbl><input style={inp} type="text" placeholder="ej. Amoxycillin" value={form.genericName} onChange={e=>setForm(f=>({...f,genericName:e.target.value}))}/></div>
            <div className="md-g2">
              <div><Lbl>Categoría</Lbl><select style={{...inp,cursor:'pointer'}} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}><option value="">Seleccionar...</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><Lbl>Unidad predeterminada</Lbl><select style={{...inp,cursor:'pointer'}} value={form.defaultUnit} onChange={e=>setForm(f=>({...f,defaultUnit:e.target.value}))}>{UNITS.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
            </div>
            <div><Lbl>Descripción</Lbl><textarea style={{...inp,resize:'vertical',minHeight:80} as React.CSSProperties} placeholder="Indicaciones, contraindicaciones, observaciones..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
            {modalMode==='edit'&&<div><Lbl>Estado</Lbl><select style={{...inp,cursor:'pointer'}} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></div>}
            {formError&&<div style={{display:'flex',gap:8,alignItems:'center',background:C.redBg,color:C.red,padding:'9px 13px',borderRadius:8,fontSize:13}}><span className="material-symbols-outlined" style={{fontSize:16}}>error</span>{formError}</div>}
          </div>
          <div className="md-mfoot"><button style={btnG} onClick={closeModal}>Cancelar</button><button style={btnP} onClick={handleSave} disabled={saving}>{saving?'Guardando...':modalMode==='create'?'Agregar':'Guardar Cambios'}</button></div>
        </div></div>
      )}

      {/* Modal Detalle */}
      {modalMode==='detail'&&selected&&(()=>{
        const[sBg,sC]=STATUS_COLOR[selected.status]??['#f1f5f9',C.gray];
        return(
          <div className="md-ov" onClick={closeModal}><div className="md-modal" onClick={e=>e.stopPropagation()}>
            <div className="md-mhead">
              <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:36,height:36,borderRadius:10,background:'#f0fdf4',display:'flex',alignItems:'center',justifyContent:'center'}}><span className="material-symbols-outlined" style={{fontSize:20,color:C.green}}>local_pharmacy</span></div><div><div style={{fontSize:16,fontWeight:700,color:C.text}}>{selected.name}</div><span className="md-badge" style={{background:sBg,color:sC}}>{STATUS_LBL[selected.status]}</span></div></div>
              <button onClick={closeModal} style={{background:'none',border:'none',cursor:'pointer',color:C.muted}}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="md-mbody">
              <div className="md-dg">{[{label:'Nombre genérico',value:selected.genericName||'—'},{label:'Categoría',value:selected.category||'—'},{label:'Unidad predeterminada',value:selected.defaultUnit||'—'},{label:'Estado',value:STATUS_LBL[selected.status]}].map(({label,value})=><div key={label} style={{background:'#f8fafc',borderRadius:8,padding:'10px 14px'}}><div style={{fontSize:11,color:C.muted,marginBottom:3}}>{label}</div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{value}</div></div>)}</div>
              {selected.description&&<div style={{background:'#f8fafc',borderRadius:8,padding:'12px 14px'}}><div style={{fontSize:11,color:C.muted,marginBottom:4,fontWeight:600}}>DESCRIPCIÓN</div><div style={{fontSize:13,color:C.sub}}>{selected.description}</div></div>}
            </div>
            <div className="md-mfoot"><button style={btnG} onClick={closeModal}>Cerrar</button>{isAdmin&&<button style={btnP} onClick={()=>openEdit(selected)}>Editar</button>}</div>
          </div></div>
        );
      })()}
    </>
  );
};

export default Medications;