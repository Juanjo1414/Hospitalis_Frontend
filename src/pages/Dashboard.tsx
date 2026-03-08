import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, FileText, AlertTriangle, Bell } from 'lucide-react';
import { getTodayAppointments, getAppointments, type Appointment } from '../services/appointments.service';
import { getPatients } from '../services/patient.service';

const C = {
  primary:'#137fec', white:'#ffffff', bg:'#f6f7f8',
  border:'#e5e7eb', borderL:'#f1f5f9',
  text:'#0f172a', sub:'#475569', muted:'#94a3b8', gray:'#64748b',
  green:'#16a34a', greenBg:'#dcfce7',
  red:'#dc2626', redBg:'#fee2e2',
  orange:'#ea580c', orangeBg:'#ffedd5',
  blue:'#2563eb', blueBg:'#dbeafe',
  purple:'#7c3aed', purpleBg:'#ede9fe',
  yellow:'#d97706', yellowBg:'#fef3c7',
};

const STATUS_STYLE: Record<string,[string,string]> = {
  scheduled:[C.blueBg,C.blue], confirmed:[C.greenBg,C.green],
  in_progress:[C.yellowBg,C.yellow], completed:['#f1f5f9',C.gray],
  cancelled:[C.redBg,C.red], no_show:['#f1f5f9',C.gray],
};
const STATUS_LABEL: Record<string,string> = {
  scheduled:'Programada', confirmed:'Confirmada', in_progress:'En Progreso',
  completed:'Completada', cancelled:'Cancelada', no_show:'No Asistió',
};

function getFechaHoy(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday:'long', year:'numeric', month:'long', day:'numeric',
  });
}

function getDoctorName(): string {
  const token = localStorage.getItem('accessToken');
  if (!token) return 'Doctor';
  const base64  = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const jsonStr = decodeURIComponent(
    Array.from(atob(base64)).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join('')
  );
  const payload = JSON.parse(jsonStr);
  return payload.fullName ?? payload.email ?? 'Doctor';
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0,0,0,0);
  return d >= start;
}

const Skeleton = ({ w='100%', h=16 }: { w?: string|number; h?: number }) => (
  <div style={{ width:w, height:h, borderRadius:6,
    background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)',
    backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
);

export const Dashboard = () => {
  const navigate   = useNavigate();
  const doctorName = getDoctorName();

  const [todayAppts,    setTodayAppts]    = useState<Appointment[]>([]);
  const [totalPatients, setTotalPatients] = useState<number|null>(null);
  const [newPatients,   setNewPatients]   = useState<number|null>(null);
  const [totalAppts,    setTotalAppts]    = useState<number|null>(null);
  const [emergencies,   setEmergencies]   = useState<number|null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true); setError('');
      try {
        const [todayRes, patientsRes, allPatientsRes, emergencyRes] = await Promise.all([
          getTodayAppointments(),
          getPatients({ limit:1 }),
          getPatients({ limit:200 }),
          getAppointments({ status:'in_progress', limit:100 }),
        ]);
        if (cancelled) return;
        setTodayAppts(todayRes.data);
        setTotalPatients(patientsRes.data.total);
        const newThisWeek = (allPatientsRes.data.data || []).filter(
          (p: any) => p.createdAt && isThisWeek(p.createdAt)
        ).length;
        setNewPatients(newThisWeek);
        setTotalAppts(todayRes.data.length);
        setEmergencies(emergencyRes.data.total ?? 0);
      } catch { if (!cancelled) setError('Error al cargar los datos del dashboard'); }
      finally  { if (!cancelled) setLoading(false); }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const stats = [
    { label:'Citas Hoy',        value:totalAppts,
      badge:totalAppts    !== null ? `${totalAppts} hoy`  : '—',
      badgeC:C.green,  badgeBg:C.greenBg,  iconC:C.blue,   iconBg:C.blueBg,   Icon:CalendarDays },
    { label:'Total Pacientes',  value:totalPatients,
      badge:totalPatients !== null ? 'Registrados'         : '—',
      badgeC:C.gray,   badgeBg:'#f1f5f9',  iconC:C.orange, iconBg:C.orangeBg, Icon:FileText },
    { label:'Nuevos Pacientes', value:newPatients,
      badge:newPatients   !== null ? '+esta semana'        : '—',
      badgeC:C.green,  badgeBg:C.greenBg,  iconC:C.purple, iconBg:C.purpleBg, Icon:Users },
    { label:'En Progreso',      value:emergencies,
      badge:emergencies !== null && emergencies > 0 ? 'Activos' : 'Ninguno',
      badgeC:emergencies && emergencies > 0 ? C.red  : C.gray,
      badgeBg:emergencies && emergencies > 0 ? C.redBg : '#f1f5f9',
      iconC:C.red, iconBg:C.redBg, Icon:AlertTriangle },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .dash-wrap { padding:28px 32px; background:${C.bg}; min-height:100vh; font-family:'Inter',-apple-system,sans-serif; }
        .dash-topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
        .dash-search { display:flex; align-items:center; gap:8px; background:${C.white}; border:1px solid ${C.border}; border-radius:10px; padding:8px 12px; width:260px; }
        .dash-search input { flex:1; font-size:13px; color:${C.sub}; border:none; outline:none; background:transparent; }
        .dash-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
        .dash-stat-card { background:${C.white}; border-radius:14px; border:1px solid ${C.border}; padding:16px 18px; display:flex; align-items:flex-start; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
        .dash-appts { background:${C.white}; border-radius:14px; border:1px solid ${C.border}; box-shadow:0 1px 3px rgba(0,0,0,0.06); margin-bottom:20px; overflow:hidden; }
        .dash-table-header { display:grid; grid-template-columns:140px 1fr 1fr 150px; padding:8px 20px; background:#f8fafc; border-bottom:1px solid ${C.borderL}; }
        .dash-table-row { display:grid; grid-template-columns:140px 1fr 1fr 150px; padding:12px 20px; align-items:center; border-bottom:1px solid ${C.borderL}; cursor:pointer; }
        .dash-table-row:hover { background:#f8fafc; }
        .dash-table-row:last-child { border-bottom:none; }
        .dash-actions { background:${C.white}; border-radius:14px; border:1px solid ${C.border}; box-shadow:0 1px 3px rgba(0,0,0,0.06); padding:16px 20px; }
        .dash-action-btns { display:flex; flex-wrap:wrap; gap:10px; }
        .dash-action-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:500; transition:filter 0.15s; }
        .dash-action-btn:hover { filter:brightness(0.93); }

        @media (max-width:1024px) {
          .dash-stats { grid-template-columns:repeat(2,1fr); }
          .dash-search { width:200px; }
        }
        @media (max-width:768px) {
          .dash-wrap { padding:16px; }
          .dash-topbar { flex-direction:column; align-items:flex-start; }
          .dash-search { width:100%; }
          .dash-stats { grid-template-columns:repeat(2,1fr); gap:10px; }
          .dash-table-header { display:none; }
          .dash-table-row { grid-template-columns:1fr; gap:4px; padding:12px 16px; }
          .dash-table-row > span:first-child { font-weight:600; color:${C.primary}; font-size:12px; }
        }
        @media (max-width:480px) {
          .dash-stats { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="dash-wrap">

        {/* Topbar */}
        <div className="dash-topbar">
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:C.text, margin:0 }}>Dashboard</h1>
            <p style={{ fontSize:13, color:C.muted, marginTop:2 }}>{getFechaHoy()}</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="dash-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke={C.muted} strokeWidth="2"/>
                <path d="M16.5 16.5L21 21" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input placeholder="Buscar pacientes, registros..." />
            </div>
            <div style={{ position:'relative' }}>
              <button style={{ padding:8, background:C.white, border:`1px solid ${C.border}`, borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Bell size={18} color={C.gray} />
              </button>
              <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:C.red, border:`1.5px solid ${C.white}` }}/>
            </div>
          </div>
        </div>

        {/* Bienvenida */}
        <div style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:17, fontWeight:600, color:'#1e293b', margin:0 }}>
            Bienvenido, {doctorName} 👋
          </h2>
          <p style={{ fontSize:13, color:C.muted, marginTop:2 }}>
            Aquí está el resumen de tu actividad diaria.
          </p>
        </div>

        {error && (
          <div style={{ background:C.redBg, color:C.red, padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:20 }}>
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="dash-stats">
          {stats.map(({ label, value, badge, badgeC, badgeBg, iconC, iconBg, Icon }) => (
            <div key={label} className="dash-stat-card">
              <div style={{ background:iconBg, borderRadius:10, padding:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={18} color={iconC} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:C.gray, marginBottom:2 }}>{label}</div>
                {loading
                  ? <><Skeleton w={40} h={28} /><div style={{ marginTop:6 }}><Skeleton w={60} h={16} /></div></>
                  : <>
                      <div style={{ fontSize:26, fontWeight:700, color:C.text, lineHeight:1.1 }}>{value ?? '—'}</div>
                      <span style={{ display:'inline-block', marginTop:4, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:999, background:badgeBg, color:badgeC }}>{badge}</span>
                    </>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Citas de hoy */}
        <div className="dash-appts">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:`1px solid ${C.borderL}` }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>Citas de Hoy</h3>
            <button onClick={() => navigate('/appointments')} style={{ fontSize:13, color:C.primary, fontWeight:500, background:'none', border:'none', cursor:'pointer' }}>
              Ver todas →
            </button>
          </div>

          <div className="dash-table-header">
            {['HORA','PACIENTE','TIPO','ESTADO'].map(h => (
              <span key={h} style={{ fontSize:11, fontWeight:600, color:C.muted, letterSpacing:'0.05em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="dash-table-row" style={{ cursor:'default' }}>
                <Skeleton w={70} /><Skeleton w={120} /><Skeleton w={100} /><Skeleton w={80} />
              </div>
            ))
          ) : todayAppts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 24px', color:C.muted, fontSize:14 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📅</div>
              No hay citas programadas para hoy
            </div>
          ) : (
            todayAppts.slice(0,8).map((a) => {
              const pat  = typeof a.patientId === 'object' ? a.patientId : null;
              const name = pat ? `${(pat as any).firstName} ${(pat as any).lastName}` : 'Desconocido';
              const [sBg,sC] = STATUS_STYLE[a.status] ?? ['#f1f5f9',C.gray];
              return (
                <div key={a._id} className="dash-table-row">
                  <span style={{ fontSize:13, fontWeight:500, color:C.sub }}>{a.startTime}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:C.blueBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:C.blue, flexShrink:0 }}>
                      {getInitials(name)}
                    </div>
                    <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{name}</span>
                  </div>
                  <span style={{ fontSize:13, color:C.sub, textTransform:'capitalize' }}>
                    {a.type?.replace('_',' ')}
                  </span>
                  <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999, background:sBg, color:sC }}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="dash-actions">
          <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:'0 0 12px' }}>Acciones Rápidas</h3>
          <div className="dash-action-btns">
            <button className="dash-action-btn" onClick={() => navigate('/patients')}
              style={{ background:C.blueBg, color:C.blue }}>
              <Users size={14} color={C.blue} /> Agregar Paciente
            </button>
            <button className="dash-action-btn" onClick={() => navigate('/appointments')}
              style={{ background:C.purpleBg, color:C.purple }}>
              <CalendarDays size={14} color={C.purple} /> Nueva Cita
            </button>
            <button className="dash-action-btn" onClick={() => navigate('/pharmacy')}
              style={{ background:C.yellowBg, color:C.yellow }}>
              <FileText size={14} color={C.yellow} /> Nueva Receta
            </button>
          </div>
        </div>

      </div>
    </>
  );
};