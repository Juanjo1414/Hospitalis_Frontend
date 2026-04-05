import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000' });
API.interceptors.request.use(c => { const t = localStorage.getItem('accessToken'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function getRole() {
  const t = localStorage.getItem('accessToken'); if (!t) return '';
  try { const b = t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'); return JSON.parse(decodeURIComponent(Array.from(atob(b)).map((c:string)=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join(''))).role ?? ''; }
  catch { return ''; }
}

interface AuditLog {
  _id: string;
  userId: { _id: string; fullname: string; email: string } | null;
  userFullName: string;
  action: string;
  resource: string;
  resourceId: string | null;
  description: string;
  ipAddress: string;
  statusCode: number | null;
  createdAt: string;
}

const C = {
  primary:'#137fec', white:'#fff', bg:'#f6f7f8', border:'#e5e7eb', borderL:'#f1f5f9',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8',
  green:'#16a34a', greenBg:'#dcfce7', red:'#dc2626', redBg:'#fee2e2',
  blue:'#2563eb', blueBg:'#dbeafe', yellow:'#d97706', yellowBg:'#fef3c7',
  purple:'#7c3aed', purpleBg:'#ede9fe',  gray:     '#64748b',
  grayBg:   '#f1f5f9',
};
const ACTION_STYLE: Record<string,[string,string,string]> = {
  create: [C.greenBg, C.green, 'add_circle'],
  update: [C.blueBg,  C.blue,  'edit'],
  delete: [C.redBg,   C.red,   'delete'],
  login:  [C.purpleBg,C.purple,'login'],
  logout: [C.grayBg, C.gray,  'logout'],
  access: [C.yellowBg,C.yellow,'visibility'],
};
const ACTION_LBL: Record<string,string> = {
  create:'Creación', update:'Actualización', delete:'Eliminación',
  login:'Inicio de sesión', logout:'Cierre de sesión', access:'Acceso',
};
const RESOURCE_LBL: Record<string,string> = {
  patients:'Pacientes', appointments:'Citas', users:'Usuarios',
  prescriptions:'Prescripciones', medications:'Medicamentos',
  settings:'Configuración', 'medical-records':'Historiales',
  messages:'Mensajes', auth:'Autenticación',
};

function fmtDate(iso:string){return new Date(iso).toLocaleString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}

const css=`
  .al-wrap{padding:28px 32px;background:${C.bg};min-height:100vh;font-family:'Inter',-apple-system,sans-serif}
  .al-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
  .al-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:center}
  .al-search{display:flex;align-items:center;gap:8px;background:${C.white};border:1px solid ${C.border};border-radius:10px;padding:8px 12px;flex:1;min-width:200px;max-width:340px}
  .al-search input{flex:1;font-size:13px;color:${C.sub};border:none;outline:none;background:transparent}
  .al-sel{padding:8px 12px;border:1px solid ${C.border};border-radius:10px;font-size:13px;color:${C.sub};background:${C.white};outline:none;cursor:pointer}
  .al-date{padding:8px 12px;border:1px solid ${C.border};border-radius:10px;font-size:13px;color:${C.sub};background:${C.white};outline:none;cursor:pointer}
  .al-card{background:${C.white};border-radius:14px;border:1px solid ${C.border};box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden}
  .al-thead{display:grid;grid-template-columns:160px 1fr 110px 110px 80px;padding:10px 20px;background:#f8fafc;border-bottom:1px solid ${C.borderL}}
  .al-trow{display:grid;grid-template-columns:160px 1fr 110px 110px 80px;padding:12px 20px;align-items:center;border-bottom:1px solid ${C.borderL};transition:background .12s}
  .al-trow:hover{background:#f8fafc}.al-trow:last-child{border-bottom:none}
  .al-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px}
  .al-access-denied{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:12px}
  .al-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .al-stat{background:${C.white};border-radius:12px;border:1px solid ${C.border};padding:16px;display:flex;align-items:center;gap:12px}
  @media(max-width:900px){.al-thead{display:none}.al-trow{grid-template-columns:1fr !important;gap:6px;padding:12px 16px}.al-stat-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:768px){.al-wrap{padding:16px}.al-stat-grid{grid-template-columns:1fr}}
`;
const Sk=({w='100%',h=14}:{w?:string|number;h?:number})=>(
  <div style={{width:w,height:h,borderRadius:5,background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>
);
const btnG: React.CSSProperties = { background:'transparent', color:C.sub, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 18px', fontSize:13, cursor:'pointer' };

export const AuditLogs = () => {
  const isAdmin = getRole() === 'admin';
  const [logs,setLogs]=useState<AuditLog[]>([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [filterAction,setFilterAction]=useState('');
  const [filterResource,setFilterResource]=useState('');
  const [filterFrom,setFilterFrom]=useState('');
  const [filterTo,setFilterTo]=useState('');
  const LIMIT=30;

  // Stats (derivadas de los datos cargados)
  const stats = {
    total: total,
    creates: logs.filter(l=>l.action==='create').length,
    updates: logs.filter(l=>l.action==='update').length,
    deletes: logs.filter(l=>l.action==='delete').length,
  };

  const load=useCallback(async()=>{
    if(!isAdmin)return;
    setLoading(true);setError('');
    try{
      const res=await API.get('/audit',{params:{page,limit:LIMIT,action:filterAction||undefined,resource:filterResource||undefined,from:filterFrom||undefined,to:filterTo||undefined}});
      setLogs(res.data.data);setTotal(res.data.total);
    }catch{setError('Error al cargar los logs de auditoría.');}
    finally{setLoading(false);}
  },[page,filterAction,filterResource,filterFrom,filterTo,isAdmin]);

  useEffect(()=>{load();},[load]);

  const totalPages=Math.ceil(total/LIMIT);

  if(!isAdmin) return(
    <>
      <style>{css}</style>
      <div className="al-wrap">
        <div className="al-access-denied">
          <span className="material-symbols-outlined" style={{fontSize:56,color:C.muted}}>security</span>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:0}}>Acceso Restringido</h2>
          <p style={{fontSize:14,color:C.muted,maxWidth:380}}>Solo los administradores pueden consultar los registros de auditoría del sistema.</p>
        </div>
      </div>
    </>
  );

  return(
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}\n${css}`}</style>
      <div className="al-wrap">
        <div className="al-topbar">
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:0}}>Auditoría y Logs</h1>
            <p style={{fontSize:13,color:C.muted,marginTop:4}}>Registro de todas las operaciones realizadas en el sistema.</p>
          </div>
          <button style={btnG} onClick={()=>load()}>
            <span className="material-symbols-outlined" style={{fontSize:15,verticalAlign:'middle',marginRight:4}}>refresh</span>
            Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="al-stat-grid">
          {[
            {label:'Total de eventos',value:total,icon:'analytics',color:C.blue,bg:C.blueBg},
            {label:'Creaciones',value:stats.creates,icon:'add_circle',color:C.green,bg:C.greenBg},
            {label:'Actualizaciones',value:stats.updates,icon:'edit',color:C.yellow,bg:C.yellowBg},
            {label:'Eliminaciones',value:stats.deletes,icon:'delete',color:C.red,bg:C.redBg},
          ].map(s=>(
            <div key={s.label} className="al-stat">
              <div style={{width:40,height:40,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <span className="material-symbols-outlined" style={{fontSize:20,color:s.color}}>{s.icon}</span>
              </div>
              <div>
                <div style={{fontSize:20,fontWeight:700,color:C.text}}>{loading?'—':s.value}</div>
                <div style={{fontSize:12,color:C.muted}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="al-filters">
          <select className="al-sel" value={filterAction} onChange={e=>{setFilterAction(e.target.value);setPage(1);}}>
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_LBL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
          <select className="al-sel" value={filterResource} onChange={e=>{setFilterResource(e.target.value);setPage(1);}}>
            <option value="">Todos los recursos</option>
            {Object.entries(RESOURCE_LBL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:12,color:C.muted}}>Desde</span>
            <input className="al-date" type="date" value={filterFrom} onChange={e=>{setFilterFrom(e.target.value);setPage(1);}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:12,color:C.muted}}>Hasta</span>
            <input className="al-date" type="date" value={filterTo} onChange={e=>{setFilterTo(e.target.value);setPage(1);}}/>
          </div>
          {(filterAction||filterResource||filterFrom||filterTo)&&(
            <button style={{...btnG,padding:'7px 14px',fontSize:12}} onClick={()=>{setFilterAction('');setFilterResource('');setFilterFrom('');setFilterTo('');setPage(1);}}>✕ Limpiar</button>
          )}
          <span style={{fontSize:13,color:C.muted,marginLeft:'auto'}}>{total} evento{total!==1?'s':''}</span>
        </div>

        {error&&<div style={{background:C.redBg,color:C.red,padding:'10px 14px',borderRadius:8,fontSize:13,marginBottom:16}}>{error}</div>}

        <div className="al-card">
          <div className="al-thead">
            {['FECHA','DESCRIPCIÓN','RECURSO','ACCIÓN','ESTADO'].map(h=>(
              <span key={h} style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'0.05em'}}>{h}</span>
            ))}
          </div>

          {loading?([1,2,3,4,5,6,7].map(i=>(
            <div key={i} className="al-trow" style={{cursor:'default'}}>
              <Sk w={100}/><div><Sk w={220}/><div style={{marginTop:5}}><Sk w={130} h={12}/></div></div><Sk w={80}/><Sk w={80}/><Sk w={50}/>
            </div>
          )))
          :logs.length===0?(
            <div style={{textAlign:'center',padding:'48px 24px',color:C.muted,fontSize:14}}>
              <div style={{fontSize:40,marginBottom:8}}>🔍</div>No hay eventos que coincidan con los filtros.
            </div>
          ):(
            logs.map(log=>{
              const[aBg,aC,aIcon]=ACTION_STYLE[log.action]??['#f1f5f9',C.gray,'circle'];
              const statusOk=(log.statusCode??200)<400;
              const userName=typeof log.userId==='object'&&log.userId?log.userId.fullname:log.userFullName||'Sistema';
              return(
                <div key={log._id} className="al-trow">
                  <div style={{fontSize:12,color:C.sub}}>{fmtDate(log.createdAt)}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:300}}>{log.description}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2,display:'flex',alignItems:'center',gap:4}}>
                      <span className="material-symbols-outlined" style={{fontSize:13}}>person</span>{userName}
                      {log.ipAddress&&<><span>•</span><span className="material-symbols-outlined" style={{fontSize:13}}>wifi</span>{log.ipAddress}</>}
                    </div>
                  </div>
                  <span style={{fontSize:12,color:C.sub,textTransform:'capitalize'}}>{RESOURCE_LBL[log.resource]??log.resource}</span>
                  <span className="al-badge" style={{background:aBg,color:aC}}>
                    <span className="material-symbols-outlined" style={{fontSize:13}}>{aIcon}</span>
                    {ACTION_LBL[log.action]??log.action}
                  </span>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:statusOk?C.green:C.red}}/>
                    <span style={{fontSize:12,color:statusOk?C.green:C.red}}>{log.statusCode??'—'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages>1&&(
          <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16}}>
            <button style={{...btnG,padding:'7px 16px'}} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Anterior</button>
            <span style={{fontSize:13,color:C.muted,alignSelf:'center'}}>{page}/{totalPages}</span>
            <button style={{...btnG,padding:'7px 16px'}} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Siguiente →</button>
          </div>
        )}
      </div>
    </>
  );
};

export default AuditLogs;