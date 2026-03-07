import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  Pill,
  Settings,
  LogOut,
} from 'lucide-react';

// ── Colores (mismo sistema que Patients / Appointments) ───────────────────────
const C = {
  primary:    '#137fec',
  primaryBg:  '#eff6ff',
  white:      '#ffffff',
  bg:         '#f6f7f8',
  border:     '#e5e7eb',
  borderLight:'#f1f5f9',
  text:       '#0f172a',
  sub:        '#475569',
  muted:      '#94a3b8',
  gray:       '#64748b',
  grayBg:     '#f1f5f9',
  red:        '#dc2626',
  redBg:      '#fee2e2',
};

// ── Leer datos del doctor desde el JWT ────────────────────────────────────────
function getDoctorInfo(): { name: string; role: string } {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return { name: 'Doctor', role: 'Médico' };
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      name: payload.fullName ?? payload.name ?? payload.email ?? 'Doctor',
      role: payload.role ?? 'Médico',
    };
  } catch {
    return { name: 'Doctor', role: 'Médico' };
  }
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ── Items de navegación ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/patients',     label: 'Patients',     Icon: Users           },
  { to: '/appointments', label: 'Appointments', Icon: CalendarDays    },
  { to: '/messages',     label: 'Messages',     Icon: MessageSquare   },
  { to: '/pharmacy',     label: 'Pharmacy',     Icon: Pill            },
  { to: '/settings',     label: 'Settings',     Icon: Settings        },
];

// ── Componente ─────────────────────────────────────────────────────────────────
export const DashboardLayout = () => {
  const navigate = useNavigate();
  const doctor   = getDoctorInfo();
  const initials = getInitials(doctor.name);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: C.bg, overflow: 'hidden',
      fontFamily: "'Inter',-apple-system,sans-serif",
    }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, minWidth: 240,
        background: C.white,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '20px 20px 18px',
          borderBottom: `1px solid ${C.borderLight}`,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {/* Cruz médica */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="6" y="1" width="4" height="14" rx="1" fill="white"/>
              <rect x="1" y="6" width="14" height="4" rx="1" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Hospitalis</div>
            <div style={{ color: C.muted, fontSize: 11 }}>Medical System</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, padding: '12px 10px',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? C.primary : C.sub,
                background: isActive ? C.primaryBg : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              })}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                if (!el.getAttribute('aria-current')) {
                  el.style.background = C.grayBg;
                  el.style.color = C.text;
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                if (!el.getAttribute('aria-current')) {
                  el.style.background = 'transparent';
                  el.style.color = C.sub;
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    color={isActive ? C.primary : C.muted}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer — doctor + logout */}
        <div style={{
          padding: '12px 10px',
          borderTop: `1px solid ${C.borderLight}`,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {/* Info del doctor */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#dbeafe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              fontSize: 11, fontWeight: 700, color: C.primary,
            }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: C.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {doctor.name}
              </div>
              <div style={{
                fontSize: 11, color: C.muted, textTransform: 'capitalize',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {doctor.role}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 12px',
              borderRadius: 8, border: 'none', background: 'transparent',
              fontSize: 13, fontWeight: 500, color: C.sub,
              cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.redBg;
              e.currentTarget.style.color = C.red;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = C.sub;
            }}
          >
            <LogOut size={17} color={C.muted} strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Contenido de la página ──────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>

    </div>
  );
};