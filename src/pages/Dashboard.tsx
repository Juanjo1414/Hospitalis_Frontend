import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/dashboard.css';

/* ──────────────────────────────────────────────────────────
   Tipos
────────────────────────────────────────────────────────── */
interface Doctor {
  fullName: string;
  email: string;
  specialty?: string;
}

interface Appointment {
  time: string;
  period: string;
  patientName: string;
  reason: string;
  status: 'confirmed' | 'pending';
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
   Datos mock para el Sprint 2 (se reemplazarán por API)
────────────────────────────────────────────────────────── */
const MOCK_APPOINTMENTS: Appointment[] = [
  { time: '09:00', period: 'AM', patientName: 'John Doe',      reason: 'General Checkup',    status: 'confirmed' },
  { time: '10:30', period: 'AM', patientName: 'Maria García',  reason: 'Follow-up Visit',    status: 'confirmed' },
  { time: '12:00', period: 'PM', patientName: 'Carlos Ruiz',   reason: 'Blood Pressure',     status: 'pending'   },
  { time: '02:00', period: 'PM', patientName: 'Ana Torres',    reason: 'Lab Results Review', status: 'confirmed' },
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

/* ──────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────── */
export const Dashboard = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [activePath, setActivePath] = useState('/dashboard');
  const [searchQuery, setSearchQuery] = useState('');

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
        /* si el JSON está corrupto, usar fallback */
        setDoctor({ fullName: 'Doctor', email: '', specialty: 'General Medicine' });
      }
    } else {
      /*
       * Si no hay user en localStorage (login previo no lo guardó),
       * decodificamos el JWT para obtener el nombre.
       * El payload del JWT tiene: { sub, fullName, email }
       */
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
          {/* Search */}
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

          {/* Actions */}
          <div className="topbar-actions">
            {/* Notificaciones */}
            <button className="topbar-icon-btn" aria-label="Notifications">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
              <span className="notif-badge" />
            </button>

            <button className="topbar-text-btn">Help</button>

            <button className="topbar-logout-btn" onClick={handleLogout}>
              Log Out
            </button>
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

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap blue">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <div className="stat-body">
                <div className="stat-label">Appointments</div>
                <div className="stat-value">12</div>
              </div>
              <span className="stat-badge green">+2 today</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap orange">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div className="stat-body">
                <div className="stat-label">Pending Reports</div>
                <div className="stat-value">4</div>
              </div>
              <span className="stat-badge orange">Pending</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap purple">
                <span className="material-symbols-outlined">group</span>
              </div>
              <div className="stat-body">
                <div className="stat-label">New Patients</div>
                <div className="stat-value">18</div>
              </div>
              <span className="stat-badge green">+5 this week</span>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap green">
                <span className="material-symbols-outlined">favorite</span>
              </div>
              <div className="stat-body">
                <div className="stat-label">Patient Satisfaction</div>
                <div className="stat-value">96%</div>
              </div>
              <span className="stat-badge green">↑ 3%</span>
            </div>
          </div>

          {/* Sección 2 columnas */}
          <div className="section-grid">
            {/* ── Today's Appointments ── */}
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
                <div className="appt-list">
                  {MOCK_APPOINTMENTS.map((appt, i) => (
                    <div key={i} className="appt-item">
                      <div className="appt-time-col">
                        <div className="appt-time">{appt.time}</div>
                        <div className="appt-period">{appt.period}</div>
                      </div>
                      <div className="appt-avatar">
                        {getInitials(appt.patientName)}
                      </div>
                      <div className="appt-info">
                        <div className="appt-name">{appt.patientName}</div>
                        <div className="appt-reason">{appt.reason}</div>
                      </div>
                      <span className={`appt-status ${appt.status}`}>
                        {appt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Quick Actions ── */}
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