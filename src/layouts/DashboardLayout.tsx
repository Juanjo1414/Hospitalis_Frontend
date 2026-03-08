import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  Pill,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

// ── Colores ────────────────────────────────────────────────────────────────────
const C = {
  primary: "#137fec",
  primaryBg: "#eff6ff",
  primaryHover: "#0d6fd4",
  white: "#ffffff",
  bg: "#f6f7f8",
  border: "#e5e7eb",
  borderLight: "#f1f5f9",
  text: "#0f172a",
  sub: "#475569",
  muted: "#94a3b8",
  gray: "#64748b",
  grayBg: "#f1f5f9",
  red: "#dc2626",
  redBg: "#fee2e2",
  purple: "#7c3aed",
  purpleBg: "#ede9fe",
};

// ── JWT helpers ────────────────────────────────────────────────────────────────
function getDoctorInfo(): { name: string; role: string } {
  const token = localStorage.getItem("accessToken");
  if (!token) return { name: "Doctor", role: "médico" };

  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonStr = decodeURIComponent(
    Array.from(atob(base64))
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
  const payload = JSON.parse(jsonStr);

  return {
    name: payload.fullName ?? payload.email ?? "Doctor",
    role: payload.role ?? "médico",
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── Nav items ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/patients", label: "Pacientes", Icon: Users },
  { to: "/appointments", label: "Citas", Icon: CalendarDays },
  { to: "/messages", label: "Mensajes", Icon: MessageSquare },
  { to: "/pharmacy", label: "Farmacia", Icon: Pill },
  { to: "/settings", label: "Configuración", Icon: Settings },
];

// ── Componente ─────────────────────────────────────────────────────────────────
export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const doctor = getDoctorInfo();
  const initials = getInitials(doctor.name);
  const isAdmin = doctor.role === "admin";

  // Estado del sidebar en móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Cerrar sidebar al hacer resize a desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  // Estilos de NavLink (reutilizable)
  const navLinkStyle = (isActive: boolean, isAdminItem = false) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? (isAdminItem ? C.purple : C.primary) : C.sub,
    background: isActive
      ? isAdminItem
        ? C.purpleBg
        : C.primaryBg
      : "transparent",
    textDecoration: "none",
    transition: "background 0.15s, color 0.15s",
  });

  const navLinkHover = (
    e: React.MouseEvent<HTMLAnchorElement>,
    enter: boolean,
  ) => {
    const el = e.currentTarget;
    if (!el.getAttribute("aria-current")) {
      el.style.background = enter ? C.grayBg : "transparent";
      el.style.color = enter ? C.text : C.sub;
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "20px 20px 18px",
          borderBottom: `1px solid ${C.borderLight}`,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: C.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="6" y="1" width="4" height="14" rx="1" fill="white" />
            <rect x="1" y="6" width="14" height="4" rx="1" fill="white" />
          </svg>
        </div>
        <div>
          <div
            style={{
              color: C.text,
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1.2,
            }}
          >
            Hospitalis
          </div>
          <div style={{ color: C.muted, fontSize: 11 }}>Sistema Médico</div>
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => navLinkStyle(isActive)}
            onMouseEnter={(e) => navLinkHover(e, true)}
            onMouseLeave={(e) => navLinkHover(e, false)}
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

        {/* Usuarios — solo admin */}
        {isAdmin && (
          <NavLink
            to="/users"
            style={({ isActive }) => navLinkStyle(isActive, true)}
            onMouseEnter={(e) => navLinkHover(e, true)}
            onMouseLeave={(e) => navLinkHover(e, false)}
          >
            {({ isActive }) => (
              <>
                <ShieldCheck
                  size={17}
                  color={isActive ? C.purple : C.muted}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                Usuarios
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 10px",
          borderTop: `1px solid ${C.borderLight}`,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              color: C.primary,
            }}
          >
            {initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.text,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {doctor.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                textTransform: "capitalize",
              }}
            >
              {doctor.role}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "9px 12px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            fontSize: 13,
            fontWeight: 500,
            color: C.sub,
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.redBg;
            e.currentTarget.style.color = C.red;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = C.sub;
          }}
        >
          <LogOut size={17} color={C.muted} strokeWidth={2} />
          Salir
        </button>
      </div>
    </>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: C.bg,
        overflow: "hidden",
        fontFamily: "'Inter',-apple-system,sans-serif",
      }}
    >
      {/* ── Overlay móvil (fondo oscuro cuando el sidebar está abierto) ──── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 40,
            backdropFilter: "blur(2px)",
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      {/* ── Sidebar Desktop (siempre visible) ───────────────────────────── */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          background: C.white,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          // Ocultar en móvil
          ...(typeof window !== "undefined" && window.innerWidth <= 768
            ? { display: "none" }
            : {}),
        }}
        className="sidebar-desktop"
      >
        <SidebarContent />
      </aside>

      {/* ── Sidebar Móvil (drawer deslizante) ───────────────────────────── */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          background: C.white,
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: sidebarOpen ? "4px 0 24px rgba(0,0,0,0.15)" : "none",
        }}
        className="sidebar-mobile"
      >
        {/* Botón cerrar en móvil */}
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: C.grayBg,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          <X size={16} color={C.sub} />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Área principal ───────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Topbar móvil con hamburger */}
        <header
          className="topbar-mobile"
          style={{
            height: 56,
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            display: "none", // se muestra vía CSS
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: C.grayBg,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Menu size={18} color={C.sub} />
          </button>

          {/* Logo centrado en móvil */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: C.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="6" y="1" width="4" height="14" rx="1" fill="white" />
                <rect x="1" y="6" width="14" height="4" rx="1" fill="white" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
              Hospitalis
            </span>
          </div>

          {/* Avatar usuario */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: C.primary,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        </header>

        {/* Contenido */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>

      {/* ── CSS responsive ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Desktop: sidebar desktop visible, mobile oculto, topbar móvil oculto */
        @media (min-width: 769px) {
          .sidebar-desktop { display: flex !important; }
          .sidebar-mobile  { display: none !important; }
          .topbar-mobile   { display: none !important; }
        }

        /* Móvil: sidebar desktop oculto, topbar móvil visible */
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .topbar-mobile   { display: flex !important; }
        }

        /* Tablet: sidebar un poco más angosto */
        @media (max-width: 1024px) and (min-width: 769px) {
          .sidebar-desktop { width: 200px !important; min-width: 200px !important; }
        }
      `}</style>
    </div>
  );
};
