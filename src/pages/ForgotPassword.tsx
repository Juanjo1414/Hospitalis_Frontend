import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";
import { forgotPassword } from "../services/auth.service";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("No se pudo enviar el correo. Intenta de nuevo más tarde.");
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

          {/* ── Estado: enviado ───────────────────────────────────────────── */}
          {sent ? (
            <div className="forgot-success">
              <div className="forgot-success-icon">📬</div>
              <h2>¡Revisa tu correo!</h2>
              <p>
                Si el correo <span className="email-highlight">{email}</span>{" "}
                está registrado, recibirás un enlace de recuperación en los
                próximos minutos.
              </p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                ¿No lo ves? Revisa tu carpeta de spam.
              </p>
            </div>
          ) : (
            /* ── Estado: formulario ──────────────────────────────────────── */
            <>
              <div className="forgot-heading">
                <h1>Forgot Password?</h1>
                <p>
                  No worries, we'll send you reset instructions. Please enter
                  the email associated with your account.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div className="auth-field">
                  <label htmlFor="fp-email">Email Address</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">
                      mail
                    </span>
                    <input
                      id="fp-email"
                      type="email"
                      placeholder="doctor@hospitalis.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
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
                  {isSubmitting ? "Enviando..." : "Send recovery link"}
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
