import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/dashboard.css';
import { getAppointments } from '../services/appointments.service';
import type { Appointment as ApiAppointment } from '../services/appointments.service';
import { getPatients } from '../services/patient.service';

/* ──────────────────────────────────────────────────────────
   Tipos
────────────────────────────────────────────────────────── */
interface Doctor {
  fullName: string;
  email: string;
  specialty?: string;
}

/* ──────────────────────────────────────────────────────────
   Nav Items 
────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { icon: 'grid_view',      label: 'Dashboard',    path: '/dashboard' },
  { icon: 'group',          label: 'Patients',     path: '/patients' },
  { icon: 'calendar_month', label: 'Appointments', path: '/appointments' },
  { icon: 'chat_bubble',    label: 'Messages',     path: '/messages' },
  { icon: 'medication',     label: 'Pharmacy',     path: '/pharmacy' },
  { icon: 'settings',       label: 'Settings',     path: '/settings' },
];

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

function getTodayStr(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(t: string): { time: string; period: string } {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { time: `${h12}:${String(m).padStart(2, '0')}`, period };
}

const TYPE_LABELS: Record<string, string> = {
  checkup: 'General Checkup', follow_up: 'Follow-up Visit',
  consultation: 'Consultation', emergency: 'Emergency',
  procedure: 'Procedure', lab: 'Lab Review',
};

/* ──────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────── */
export const Dashboard = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [activePath, setActivePath] = useState('/dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Estado dinámico
  const [todayAppts, setTodayAppts] = useState<ApiAppointment[]>([]);
  const [totalPatients, setTotalPatients] = useState<number | null>(null);
  const [loadingAppts, setLoadingAppts] = useState(true);

  /* Leer datos del médico autenticado desde localStorage */
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setDoctor(JSON.parse(stored));
      } catch {
        setDoctor({ fullName: 'Doctor', email: '', specialty: 'General Medicine' });
      }
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setDoctor({
          fullName:  payload.fullName  ?? payload.name ?? 'Doctor',
          email:     payload.email     ?? '',
          specialty: payload.specialty ?? 'General Medicine',
        });
      } catch {
        setDoctor({ fullName: 'Doctor', email: '', specialty: 'General Medicine' });
      }
    }
  }, [navigate]);

  /* Cargar citas de hoy y stats desde la API */
  useEffect(() => {
    const load = async () => {
      setLoadingAppts(true);
      try {
        const [apptsTodayRes, patientsRes] = await Promise.allSettled([
          getAppointments({ date: todayISO(), limit: 10 }),
          getPatients({ limit: 1 }),
        ]);

        if (apptsTodayRes.status === 'fulfilled') {
          setTodayAppts(apptsTodayRes.value.data.data);
        }
        if (patientsRes.status === 'fulfilled') {
          setTotalPatients(patientsRes.value.data.total);
        }
      } catch (err) {
        console.error('Dashboard API error:', err);
      } finally {
        setLoadingAppts(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    setActivePath(path);
    navigate(path);
  };

  const displayName = doctor?.fullName ?? '...';
  const specialty   = doctor?.specialty ?? '';
  const initials    = doctor ? getInitials(doctor.fullName) : '?';

  // Stats derivados de datos reales
  const todayCount     = todayAppts.length;
  const pendingCount   = todayAppts.filter(a => a.status === 'scheduled' || a.status === 'in_progress').length;
  const confirmedCount = todayAppts.filter(a => a.status === 'confirmed').length;

  return (
    <div className="app-shell">
      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              local_hospital
            </span>
          </div>
          <span className="brand-name">Hospitalis</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`sidebar-nav-item ${activePath === item.path ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              <span className={`nav-icon material-symbols-outlined ${activePath === item.path ? 'filled' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Doctor profile footer */}
        <div className="sidebar-footer">
          <div className="sidebar-doctor">
            <div className="sidebar-doctor-avatar">
              {initials}
              <span className="online-dot" />
            </div>
            <div className="sidebar-doctor-info">
              <div className="sidebar-doctor-name">
                Dr. {displayName.replace(/^Dr\.?\s*/i, '')}
              </div>
              <div className="sidebar-doctor-role">{specialty}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════ */}
      <div className="main-area">
        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="topbar-search">
            <div className="search-box">
              <span className="search-icon material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Global search (patients, doctors, medicine)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="topbar-actions">
            <button className="topbar-icon-btn" aria-label="Notifications">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
              <span className="notif-badge" />
            </button>
            <button className="topbar-text-btn">Help</button>
            <button className="topbar-logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="page-content">
          {/* Welcome */}
          <div className="welcome-banner">
            <h1>
              {getGreeting()}, Dr. {displayName.replace(/^Dr\.?\s*/i, '')} 👋
            </h1>
            <p>{getTodayStr()} · Here is your daily activity summary.</p>
          </div>

          {/* Stats — ahora con datos reales de citas de hoy */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap blue">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <div className="stat-body">
                <div className="stat-label">Appointments Today</div>
                <div className="stat-value">{loadingAppts ? '—' : todayCount}</div>
              </div>
              <span className="stat-badge green">
                {loadingAppts ? '...' : `${todayCount} today`}
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap orange">
                <span className="material-symbols-outlined">pending_actions</span>
              </div>
              <div className="stat-body">
                <div className="stat-label">Pending / In Progress</div>
                <div className="stat-value">{loadingAppts ? '—' : pendingCount}</div>
              </div>
              <span className="stat-badge orange">Pending</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap purple">
                <span className="material-symbols-outlined">group</span>
              </div>
              <div className="stat-body">
                <div className="stat-label">Total Patients</div>
                <div className="stat-value">{totalPatients ?? '—'}</div>
              </div>
              <span className="stat-badge green">Registered</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap green">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="stat-body">
                <div className="stat-label">Confirmed Today</div>
                <div className="stat-value">{loadingAppts ? '—' : confirmedCount}</div>
              </div>
              <span className="stat-badge green">Confirmed</span>
            </div>
          </div>

          {/* Sección 2 columnas */}
          <div className="section-grid">
            {/* ── Today's Appointments — DINÁMICO ── */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon material-symbols-outlined">calendar_today</span>
                  Today's Appointments
                </div>
                <button
                  className="card-action"
                  onClick={() => handleNavClick('/appointments')}
                >
                  View all
                </button>
              </div>
              <div className="card-body">

                {/* Loading */}
                {loadingAppts && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14 }}>
                    Loading appointments...
                  </div>
                )}

                {/* Empty state */}
                {!loadingAppts && todayAppts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>
                      event_available
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#475569', marginBottom: 4 }}>
                      No appointments today
                    </div>
                    <div style={{ fontSize: 13 }}>Your schedule is clear for today.</div>
                    <button
                      className="card-action"
                      style={{ marginTop: 12, fontSize: 13 }}
                      onClick={() => handleNavClick('/appointments')}
                    >
                      + Schedule appointment
                    </button>
                  </div>
                )}

                {/* Lista de citas reales */}
                {!loadingAppts && todayAppts.length > 0 && (
                  <div className="appt-list">
                    {todayAppts.map((appt) => {
                      const pat = typeof appt.patientId === 'object' ? appt.patientId : null;
                      const patientName = pat
                        ? `${pat.firstName} ${pat.lastName}`
                        : 'Patient';
                      const reason = TYPE_LABELS[appt.type] ?? appt.type;
                      const { time, period } = fmtTime(appt.startTime);

                      // Mapear status a clase CSS existente
                      const statusClass =
                        appt.status === 'confirmed'  ? 'confirmed' :
                        appt.status === 'completed'  ? 'confirmed' :
                        appt.status === 'cancelled'  ? 'cancelled' : 'pending';

                      const statusLabel =
                        appt.status === 'confirmed'   ? 'Confirmed'   :
                        appt.status === 'completed'   ? 'Completed'   :
                        appt.status === 'in_progress' ? 'In Progress' :
                        appt.status === 'cancelled'   ? 'Cancelled'   :
                        appt.status === 'no_show'     ? 'No Show'     : 'Pending';

                      return (
                        <div key={appt._id} className="appt-item">
                          <div className="appt-time-col">
                            <div className="appt-time">{time}</div>
                            <div className="appt-period">{period}</div>
                          </div>
                          <div className="appt-avatar">
                            {getInitials(patientName)}
                          </div>
                          <div className="appt-info">
                            <div className="appt-name">{patientName}</div>
                            <div className="appt-reason">
                              {reason}{appt.room ? ` · ${appt.room}` : ''}
                            </div>
                          </div>
                          <span className={`appt-status ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Quick Actions — sin cambios ── */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon material-symbols-outlined">bolt</span>
                  Quick Actions
                </div>
              </div>
              <div className="card-body">
                <div className="quick-actions">
                  <button
                    className="quick-action-btn"
                    onClick={() => handleNavClick('/appointments')}
                  >
                    <div className="qa-icon">
                      <span className="material-symbols-outlined">add_circle</span>
                    </div>
                    <span className="qa-label">New Appointment</span>
                  </button>

                  <button
                    className="quick-action-btn"
                    onClick={() => handleNavClick('/patients')}
                  >
                    <div className="qa-icon">
                      <span className="material-symbols-outlined">person_add</span>
                    </div>
                    <span className="qa-label">Add Patient</span>
                  </button>

                  <button className="quick-action-btn">
                    <div className="qa-icon">
                      <span className="material-symbols-outlined">assignment</span>
                    </div>
                    <span className="qa-label">New Report</span>
                  </button>

                  <button className="quick-action-btn">
                    <div className="qa-icon">
                      <span className="material-symbols-outlined">medication</span>
                    </div>
                    <span className="qa-label">Prescription</span>
                  </button>

                  <button className="quick-action-btn">
                    <div className="qa-icon">
                      <span className="material-symbols-outlined">science</span>
                    </div>
                    <span className="qa-label">Order Lab Test</span>
                  </button>

                  <button className="quick-action-btn">
                    <div className="qa-icon">
                      <span className="material-symbols-outlined">chat_bubble</span>
                    </div>
                    <span className="qa-label">Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};