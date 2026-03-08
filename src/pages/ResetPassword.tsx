import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
});

const resetPasswordApi = (token: string, newPassword: string) =>
  API.post("/auth/reset-password", { token, newPassword });

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const hasToken = Boolean(token);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(3);

  // Cuenta regresiva al éxito
  useEffect(() => {
    if (!success) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/login");
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPasswordApi(token!, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Ocurrió un error. Intenta solicitar un nuevo enlace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        {/* Barra azul superior */}
        <div className="forgot-card-top-bar" />

        <div className="forgot-card-body">
          {/* Brand */}
          <div className="forgot-brand-center">
            <div className="brand-icon">+</div>
            <span>Hospitalis</span>
          </div>

          {/* ── Sin token en URL ──────────────────────────────────────────── */}
          {!hasToken && (
            <div className="forgot-success">
              <div
                className="forgot-success-icon"
                style={{ background: "#fee2e2", color: "#dc2626" }}
              >
                🔗
              </div>
              <h2>Enlace inválido</h2>
              <p>Este enlace de recuperación no es válido o ya expiró.</p>
              <Link
                to="/forgot-password"
                className="btn-primary"
                style={{ marginTop: 16, textDecoration: "none" }}
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          )}

          {/* ── Éxito ─────────────────────────────────────────────────────── */}
          {hasToken && success && (
            <div className="forgot-success">
              <div className="forgot-success-icon">✅</div>
              <h2>¡Contraseña actualizada!</h2>
              <p>Tu contraseña fue cambiada exitosamente.</p>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
                Redirigiendo al login en <strong>{countdown}</strong>{" "}
                segundos...
              </p>
              <Link
                to="/login"
                className="btn-primary"
                style={{ marginTop: 16, textDecoration: "none" }}
              >
                Ir al login ahora
              </Link>
            </div>
          )}

          {/* ── Formulario ────────────────────────────────────────────────── */}
          {hasToken && !success && (
            <>
              <div className="forgot-heading">
                <h1>Nueva contraseña</h1>
                <p>
                  Ingresa tu nueva contraseña para recuperar el acceso a tu
                  cuenta.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Nueva contraseña */}
                <div className="auth-field">
                  <label htmlFor="new-password">Nueva contraseña</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">
                      lock
                    </span>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-action"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label="toggle password"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20 }}
                      >
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div className="auth-field">
                  <label htmlFor="confirm-password">Confirmar contraseña</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">
                      lock_reset
                    </span>
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-action"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label="toggle confirm"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20 }}
                      >
                        {showConfirm ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="auth-error">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18 }}
                    >
                      error
                    </span>
                    {error}
                  </div>
                )}

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Cambiar contraseña"}
                </button>
              </form>
            </>
          )}

          {/* Volver al login */}
          <div className="forgot-actions">
            <Link to="/login" className="btn-back-link">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
              >
                arrow_back
              </span>
              Back to login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="forgot-card-footer">
          © 2026 Hospitalis Medical Systems. Secure &amp; Private.
        </div>
      </div>
    </div>
  );
};
