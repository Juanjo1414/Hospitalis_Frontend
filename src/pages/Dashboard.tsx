import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CalendarDays,
  FileText,
  AlertTriangle,
  Search,
  Bell,
} from "lucide-react";
import {
  getTodayAppointments,
  getAppointments,
  type Appointment,
} from "../services/appointments.service";
import { getPatients } from "../services/patient.service";

// ── Colores ───────────────────────────────────────────────────────────────────
const C = {
  primary: "#137fec",
  white: "#ffffff",
  bg: "#f6f7f8",
  border: "#e5e7eb",
  borderL: "#f1f5f9",
  text: "#0f172a",
  sub: "#475569",
  muted: "#94a3b8",
  gray: "#64748b",
  green: "#16a34a",
  greenBg: "#dcfce7",
  red: "#dc2626",
  redBg: "#fee2e2",
  orange: "#ea580c",
  orangeBg: "#ffedd5",
  blue: "#2563eb",
  blueBg: "#dbeafe",
  purple: "#7c3aed",
  purpleBg: "#ede9fe",
  yellow: "#d97706",
  yellowBg: "#fef3c7",
};

const STATUS_STYLE: Record<string, [string, string]> = {
  scheduled: [C.blueBg, C.blue],
  confirmed: [C.greenBg, C.green],
  in_progress: [C.yellowBg, C.yellow],
  completed: ["#f1f5f9", C.gray],
  cancelled: [C.redBg, C.red],
  no_show: ["#f1f5f9", C.gray],
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTodayFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDoctorName(): string {
  const token = localStorage.getItem("accessToken");
  if (!token) return "Doctor";
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const jsonStr = decodeURIComponent(
    Array.from(atob(base64))
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
  const payload = JSON.parse(jsonStr);
  return payload.fullName ?? payload.email ?? "Doctor";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({
  w = "100%",
  h = 16,
}: {
  w?: string | number;
  h?: number;
}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 6,
      background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

// ── Componente ────────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();
  const doctorName = getDoctorName();

  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [totalPatients, setTotalPatients] = useState<number | null>(null);
  const [newPatients, setNewPatients] = useState<number | null>(null);
  const [totalAppts, setTotalAppts] = useState<number | null>(null);
  const [emergencies, setEmergencies] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [todayRes, patientsRes, allPatientsRes, emergencyRes] =
          await Promise.all([
            // Citas de hoy
            getTodayAppointments(),
            // Total pacientes + nuevos esta semana
            getPatients({ limit: 1 }),
            getPatients({ limit: 200 }),
            // Citas de emergencia activas (tipo emergency o status in_progress)
            getAppointments({ status: "in_progress", limit: 100 }),
          ]);

        if (cancelled) return;

        setTodayAppts(todayRes.data);
        setTotalPatients(patientsRes.data.total);

        // Pacientes nuevos esta semana
        const newThisWeek = (allPatientsRes.data.data || []).filter(
          (p) => p.createdAt && isThisWeek(p.createdAt),
        ).length;
        setNewPatients(newThisWeek);

        // Total de citas de hoy
        setTotalAppts(todayRes.data.length);

        // Urgencias: in_progress + tipo emergency
        const inProgress = emergencyRes.data.total ?? 0;
        setEmergencies(inProgress);
      } catch (e) {
        if (!cancelled) setError("Error loading dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      label: "Appointments Today",
      value: totalAppts,
      badge: totalAppts !== null ? `${totalAppts} today` : "—",
      badgeC: C.green,
      badgeBg: C.greenBg,
      iconC: C.blue,
      iconBg: C.blueBg,
      Icon: CalendarDays,
    },
    {
      label: "Total Patients",
      value: totalPatients,
      badge: totalPatients !== null ? "Registered" : "—",
      badgeC: C.gray,
      badgeBg: "#f1f5f9",
      iconC: C.orange,
      iconBg: C.orangeBg,
      Icon: FileText,
    },
    {
      label: "New Patients",
      value: newPatients,
      badge: newPatients !== null ? "+this week" : "—",
      badgeC: C.green,
      badgeBg: C.greenBg,
      iconC: C.purple,
      iconBg: C.purpleBg,
      Icon: Users,
    },
    {
      label: "In Progress",
      value: emergencies,
      badge: emergencies !== null && emergencies > 0 ? "Active" : "None",
      badgeC: emergencies && emergencies > 0 ? C.red : C.gray,
      badgeBg: emergencies && emergencies > 0 ? C.redBg : "#f1f5f9",
      iconC: C.red,
      iconBg: C.redBg,
      Icon: AlertTriangle,
    },
  ];

  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div
        style={{
          padding: "28px 32px",
          background: C.bg,
          minHeight: "100vh",
          fontFamily: "'Inter',-apple-system,sans-serif",
        }}
      >
        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: C.text,
                margin: 0,
              }}
            >
              Dashboard
            </h1>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
              {getTodayFormatted()}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "8px 12px",
                width: 260,
              }}
            >
              <Search size={15} color={C.muted} />
              <input
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: C.sub,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                }}
                placeholder="Search patients, records..."
              />
            </div>
            <div style={{ position: "relative" }}>
              <button
                style={{
                  padding: 8,
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={18} color={C.gray} />
              </button>
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: C.red,
                  border: `1.5px solid ${C.white}`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Welcome ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#1e293b",
              margin: 0,
            }}
          >
            Welcome back, {doctorName} 👋
          </h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
            Here is your daily activity summary.
          </p>
        </div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              background: C.redBg,
              color: C.red,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {stats.map(
            ({ label, value, badge, badgeC, badgeBg, iconC, iconBg, Icon }) => (
              <div
                key={label}
                style={{
                  background: C.white,
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    background: iconBg,
                    borderRadius: 10,
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={iconC} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: C.gray, marginBottom: 2 }}>
                    {label}
                  </div>
                  {loading ? (
                    <>
                      <Skeleton w={40} h={28} />
                      <div style={{ marginTop: 6 }}>
                        <Skeleton w={60} h={16} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 700,
                          color: C.text,
                          lineHeight: 1.1,
                        }}
                      >
                        {value ?? "—"}
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: badgeBg,
                          color: badgeC,
                        }}
                      >
                        {badge}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ),
          )}
        </div>

        {/* ── Today's Appointments ────────────────────────────────────────── */}
        <div
          style={{
            background: C.white,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: `1px solid ${C.borderL}`,
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.text,
                margin: 0,
              }}
            >
              Today's Appointments
            </h3>
            <button
              onClick={() => navigate("/appointments")}
              style={{
                fontSize: 13,
                color: C.primary,
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              View all →
            </button>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr 1fr 150px",
              padding: "8px 20px",
              background: "#f8fafc",
              borderBottom: `1px solid ${C.borderL}`,
            }}
          >
            {["TIME", "PATIENT", "TYPE", "STATUS"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.muted,
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr 1fr 150px",
                  padding: "14px 20px",
                  gap: 12,
                  borderBottom: `1px solid ${C.borderL}`,
                  alignItems: "center",
                }}
              >
                <Skeleton w={70} />
                <Skeleton w={120} />
                <Skeleton w={100} />
                <Skeleton w={80} />
              </div>
            ))
          ) : todayAppts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 24px",
                color: C.muted,
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
              No appointments scheduled for today
            </div>
          ) : (
            todayAppts.slice(0, 8).map((a, i) => {
              const pat = typeof a.patientId === "object" ? a.patientId : null;
              const name = pat ? `${pat.firstName} ${pat.lastName}` : "Unknown";
              const [sBg, sC] = STATUS_STYLE[a.status] ?? ["#f1f5f9", C.gray];
              return (
                <div
                  key={a._id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 1fr 150px",
                    padding: "12px 20px",
                    alignItems: "center",
                    borderBottom:
                      i < todayAppts.length - 1
                        ? `1px solid ${C.borderL}`
                        : "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f8fafc")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.sub }}>
                    {a.startTime}
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: C.blueBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.blue,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(name)}
                    </div>
                    <span
                      style={{ fontSize: 13, fontWeight: 500, color: C.text }}
                    >
                      {name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: C.sub,
                      textTransform: "capitalize",
                    }}
                  >
                    {a.type?.replace("_", " ")}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: sBg,
                      color: sC,
                    }}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <div
          style={{
            background: C.white,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            padding: "16px 20px",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: C.text,
              margin: "0 0 12px",
            }}
          >
            Quick Actions
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              onClick={() => navigate("/patients")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: C.blueBg,
                color: C.blue,
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#bfdbfe")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = C.blueBg)
              }
            >
              <Users size={14} color={C.blue} /> Add Patient
            </button>
            <button
              onClick={() => navigate("/appointments")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: C.purpleBg,
                color: C.purple,
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#ddd6fe")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = C.purpleBg)
              }
            >
              <CalendarDays size={14} color={C.purple} /> New Appointment
            </button>
            <button
              onClick={() => navigate("/pharmacy")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: C.yellowBg,
                color: C.yellow,
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fde68a")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = C.yellowBg)
              }
            >
              <FileText size={14} color={C.yellow} /> New Rx
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
