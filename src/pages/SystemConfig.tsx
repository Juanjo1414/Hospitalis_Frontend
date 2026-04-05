import { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000' });
API.interceptors.request.use(c => { const t = localStorage.getItem('accessToken'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

function getRole() {
  const t = localStorage.getItem('accessToken'); if (!t) return '';
  try { const b = t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'); return JSON.parse(decodeURIComponent(Array.from(atob(b)).map((c:string)=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join(''))).role ?? ''; }
  catch { return ''; }
}

const C = {
  primary:'#137fec', white:'#fff', bg:'#f6f7f8', border:'#e5e7eb', borderL:'#f1f5f9',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8',
  green:'#16a34a', greenBg:'#dcfce7', red:'#dc2626', redBg:'#fee2e2',
  blue:'#2563eb', blueBg:'#dbeafe',
};

const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', background:C.white };
const btnP: React.CSSProperties = { background:C.primary, color:'#fff', border:'none', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:600, cursor:'pointer' };
const btnG: React.CSSProperties = { background:'transparent', color:C.sub, border:`1px solid ${C.border}`, borderRadius:10, padding:'8px 18px', fontSize:13, cursor:'pointer' };

const css = `
  .sc-wrap{padding:28px 32px;background:${C.bg};min-height:100vh;font-family:'Inter',-apple-system,sans-serif}
  .sc-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
  .sc-grid{display:grid;grid-template-columns:260px 1fr;gap:24px;align-items:start}
  .sc-nav{background:${C.white};border-radius:14px;border:1px solid ${C.border};padding:8px;position:sticky;top:20px}
  .sc-nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;cursor:pointer;border:none;background:transparent;width:100%;text-align:left;transition:background .12s;font-size:13px;color:${C.sub};font-weight:500}
  .sc-nav-item:hover{background:#f8fafc;color:${C.text}}
  .sc-nav-item.active{background:${C.blueBg};color:${C.blue};font-weight:600}
  .sc-panel{display:flex;flex-direction:column;gap:16px}
  .sc-card{background:${C.white};border-radius:14px;border:1px solid ${C.border};padding:24px}
  .sc-card-title{font-size:15px;font-weight:700;color:${C.text};margin:0 0 4px}
  .sc-card-sub{font-size:13px;color:${C.muted};margin:0 0 20px}
  .sc-divider{border:none;border-top:1px solid ${C.borderL};margin:16px 0}
  .sc-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .sc-switch{position:relative;display:inline-block;width:44px;height:24px}
  .sc-switch input{opacity:0;width:0;height:0}
  .sc-slider{position:absolute;inset:0;background:#cbd5e1;border-radius:24px;transition:.2s;cursor:pointer}
  .sc-slider:before{content:'';position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.2s}
  input:checked+.sc-slider{background:${C.primary}}
  input:checked+.sc-slider:before{transform:translateX(20px)}
  .sc-access-denied{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:12px}
  @media(max-width:900px){.sc-grid{grid-template-columns:1fr}.sc-nav{position:static;display:flex;flex-wrap:wrap;gap:4px;padding:6px}}
  @media(max-width:768px){.sc-wrap{padding:16px}.sc-g2{grid-template-columns:1fr}}
`;
const Lbl=({children}:{children:React.ReactNode})=>(
  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:5}}>{children}</label>
);
const Sk=({w='100%',h=14}:{w?:string|number;h?:number})=>(
  <div style={{width:w,height:h,borderRadius:5,background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>
);

const SECTIONS = [
  { id:'hospital',  icon:'local_hospital', label:'Información del Hospital' },
  { id:'operacion', icon:'settings',       label:'Configuración Operativa' },
  { id:'seguridad', icon:'shield',         label:'Seguridad y Acceso' },
];

export const SystemConfig = () => {
  const isAdmin = getRole() === 'admin';
  const [activeSection, setActiveSection] = useState('hospital');
  const [config, setConfig]   = useState<Record<string,any>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState<{ type: 'success'|'error'; msg: string } | null>(null);

  useEffect(()=>{
    API.get('/settings')
      .then(r => setConfig(r.data))
      .catch(()  => setAlert({ type:'error', msg:'Error al cargar la configuración.' }))
      .finally(()=> setLoading(false));
  },[]);

  const handleChange = (key: string, val: any) => setConfig(c => ({ ...c, [key]: val }));

  const handleSave = async () => {
    setSaving(true); setAlert(null);
    try {
      const res = await API.put('/settings', config);
      setConfig(res.data);
      setAlert({ type:'success', msg:'Configuración guardada correctamente.' });
      setTimeout(()=>setAlert(null), 3500);
    } catch (err:any) {
      setAlert({ type:'error', msg: err?.response?.data?.message ?? 'Error al guardar.' });
    } finally { setSaving(false); }
  };

  if (!isAdmin) return (
    <>
      <style>{css}</style>
      <div className="sc-wrap">
        <div className="sc-access-denied">
          <span className="material-symbols-outlined" style={{fontSize:56,color:C.muted}}>lock</span>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:0}}>Acceso Restringido</h2>
          <p style={{fontSize:14,color:C.muted,maxWidth:380}}>Solo los administradores pueden ver y modificar la configuración del sistema.</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}\n${css}`}</style>
      <div className="sc-wrap">
        <div className="sc-topbar">
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:0}}>Configuración del Sistema</h1>
            <p style={{fontSize:13,color:C.muted,marginTop:4}}>Parámetros globales de la plataforma Hospitalis.</p>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button style={btnG} onClick={()=>window.location.reload()}>Restablecer</button>
            <button style={btnP} onClick={handleSave} disabled={saving}>{saving?'Guardando...':'Guardar Cambios'}</button>
          </div>
        </div>

        {alert && (
          <div style={{background: alert.type==='success'?C.greenBg:C.redBg, color: alert.type==='success'?C.green:C.red, padding:'10px 14px', borderRadius:10, fontSize:13, marginBottom:16, display:'flex', gap:8, alignItems:'center'}}>
            <span className="material-symbols-outlined" style={{fontSize:16}}>{alert.type==='success'?'check_circle':'error'}</span>
            {alert.msg}
          </div>
        )}

        <div className="sc-grid">
          {/* Nav lateral */}
          <nav className="sc-nav">
            {SECTIONS.map(s => (
              <button key={s.id} className={`sc-nav-item${activeSection===s.id?' active':''}`} onClick={()=>setActiveSection(s.id)}>
                <span className="material-symbols-outlined" style={{fontSize:18}}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>

          {/* Panel */}
          <div className="sc-panel">
            {loading ? (
              <div className="sc-card"><Sk h={20} w={200}/><div style={{marginTop:16,display:'flex',flexDirection:'column',gap:12}}><Sk/><Sk/><Sk/><Sk/></div></div>
            ) : (
              <>
                {activeSection==='hospital' && (
                  <div className="sc-card">
                    <p className="sc-card-title">Información del Hospital</p>
                    <p className="sc-card-sub">Datos identificativos de la institución de salud.</p>
                    <div style={{display:'flex',flexDirection:'column',gap:14}}>
                      <div><Lbl>Nombre del Hospital</Lbl><input style={inp} type="text" value={config.hospitalName??''} onChange={e=>handleChange('hospitalName',e.target.value)} placeholder="ej. Hospital General"/></div>
                      <div><Lbl>Dirección</Lbl><input style={inp} type="text" value={config.hospitalAddress??''} onChange={e=>handleChange('hospitalAddress',e.target.value)} placeholder="Calle 123 #45-67, Bogotá"/></div>
                      <div className="sc-g2">
                        <div><Lbl>Teléfono</Lbl><input style={inp} type="tel" value={config.hospitalPhone??''} onChange={e=>handleChange('hospitalPhone',e.target.value)} placeholder="+57 1 234 5678"/></div>
                        <div><Lbl>Correo Institucional</Lbl><input style={inp} type="email" value={config.hospitalEmail??''} onChange={e=>handleChange('hospitalEmail',e.target.value)} placeholder="info@hospital.com"/></div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection==='operacion' && (
                  <div className="sc-card">
                    <p className="sc-card-title">Configuración Operativa</p>
                    <p className="sc-card-sub">Parámetros que afectan el comportamiento clínico del sistema.</p>
                    <div style={{display:'flex',flexDirection:'column',gap:14}}>
                      <div className="sc-g2">
                        <div>
                          <Lbl>Zona Horaria</Lbl>
                          <select style={{...inp,cursor:'pointer'}} value={config.timezone??'America/Bogota'} onChange={e=>handleChange('timezone',e.target.value)}>
                            <option value="America/Bogota">América/Bogotá (UTC-5)</option>
                            <option value="America/Caracas">América/Caracas (UTC-4)</option>
                            <option value="America/Lima">América/Lima (UTC-5)</option>
                            <option value="America/Mexico_City">América/México (UTC-6)</option>
                            <option value="America/Santiago">América/Santiago (UTC-4)</option>
                            <option value="America/Buenos_Aires">América/Buenos Aires (UTC-3)</option>
                            <option value="Europe/Madrid">Europa/Madrid (UTC+1)</option>
                            <option value="UTC">UTC</option>
                          </select>
                        </div>
                        <div>
                          <Lbl>Idioma / Locale</Lbl>
                          <select style={{...inp,cursor:'pointer'}} value={config.locale??'es-CO'} onChange={e=>handleChange('locale',e.target.value)}>
                            <option value="es-CO">Español (Colombia)</option>
                            <option value="es-MX">Español (México)</option>
                            <option value="es-ES">Español (España)</option>
                            <option value="es-AR">Español (Argentina)</option>
                          </select>
                        </div>
                      </div>
                      <hr className="sc-divider"/>
                      <div className="sc-g2">
                        <div>
                          <Lbl>Duración por defecto de cita (minutos)</Lbl>
                          <input style={inp} type="number" min="5" max="240" step="5" value={config.defaultAppointmentDuration??30} onChange={e=>handleChange('defaultAppointmentDuration',+e.target.value)}/>
                        </div>
                        <div>
                          <Lbl>Máximo de citas por médico/día</Lbl>
                          <input style={inp} type="number" min="1" max="100" value={config.maxAppointmentsPerDay??20} onChange={e=>handleChange('maxAppointmentsPerDay',+e.target.value)}/>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection==='seguridad' && (
                  <div className="sc-card">
                    <p className="sc-card-title">Seguridad y Acceso</p>
                    <p className="sc-card-sub">Controla el comportamiento de registro y mantenimiento.</p>
                    <div style={{display:'flex',flexDirection:'column',gap:20}}>
                      {/* Toggle: Registro */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'#f8fafc',borderRadius:10,border:'1px solid #f1f5f9'}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:C.text}}>Permitir registro de nuevos usuarios</div>
                          <div style={{fontSize:12,color:C.muted,marginTop:2}}>Si está desactivado, solo los administradores pueden crear cuentas.</div>
                        </div>
                        <label className="sc-switch">
                          <input type="checkbox" checked={config.allowRegistration??true} onChange={e=>handleChange('allowRegistration',e.target.checked)}/>
                          <span className="sc-slider"/>
                        </label>
                      </div>
                      {/* Toggle: Mantenimiento */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background: config.maintenanceMode?C.redBg:'#f8fafc',borderRadius:10,border:`1px solid ${config.maintenanceMode?'#fecaca':'#f1f5f9'}`}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:config.maintenanceMode?C.red:C.text}}>Modo mantenimiento</div>
                          <div style={{fontSize:12,color:C.muted,marginTop:2}}>Los usuarios no administradores verán un mensaje de mantenimiento al intentar acceder.</div>
                        </div>
                        <label className="sc-switch">
                          <input type="checkbox" checked={config.maintenanceMode??false} onChange={e=>handleChange('maintenanceMode',e.target.checked)}/>
                          <span className="sc-slider"/>
                        </label>
                      </div>
                      {config.maintenanceMode && (
                        <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#c2410c',display:'flex',gap:8,alignItems:'center'}}>
                          <span className="material-symbols-outlined" style={{fontSize:16}}>warning</span>
                          El modo mantenimiento está activo. Los usuarios regulares no podrán acceder al sistema.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Info del sistema */}
                <div className="sc-card" style={{background:'#f8fafc'}}>
                  <p className="sc-card-title" style={{fontSize:13,color:C.muted}}>Información del sistema</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'8px 24px',marginTop:8}}>
                    {[['Plataforma','Hospitalis v1.0'],['Backend','NestJS + MongoDB'],['Última modificación',config.updatedAt?new Date(config.updatedAt).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—']].map(([k,v])=>(
                      <div key={k}><span style={{fontSize:11,color:C.muted}}>{k}: </span><span style={{fontSize:12,fontWeight:600,color:C.sub}}>{v}</span></div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SystemConfig;