import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/auth.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // TODO: conectar con el endpoint /auth/forgot-password
      // await forgotPassword(email);
      await new Promise((r) => setTimeout(r, 800)); // simulación mientras conectamos
      setSubmitted(true);
    } catch (err: any) {
      setError('Could not send the recovery email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        {/* Barra de color primario arriba */}
        <div className="forgot-card-top-bar" />

        <div className="forgot-card-body">
          {/* Logo centrado */}
          <div className="forgot-brand-center">
            <div className="brand-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                local_hospital
              </span>
            </div>
            Hospitalis
          </div>

          {/* Heading */}
          <div className="forgot-heading">
            <h1>Forgot Password?</h1>
            <p>
              No worries, we'll send you reset instructions. Please enter the
              email associated with your account.
            </p>
          </div>

          {submitted ? (
            /* ── Estado: correo enviado ── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--green-bg)',
                  color: 'var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
                  mark_email_read
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                We've sent a recovery link to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
                Check your inbox and follow the instructions.
              </p>
            </div>
          ) : (
            /* ── Formulario ── */
            <form
              onSubmit={handleSubmit}
              className="forgot-actions"
            >
              <div className="auth-field">
                <label htmlFor="forgot-email">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon material-symbols-outlined">mail</span>
                  <input
                    id="forgot-email"
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
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    error
                  </span>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send recovery link'}
              </button>
            </form>
          )}

          {/* Back to login */}
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" className="btn-back-link">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_back
              </span>
              Back to login
            </Link>
          </div>
        </div>

        <div className="forgot-card-footer">
          © 2024 Hospitalis Medical Systems. Secure &amp; Private.
        </div>
      </div>
    </div>
  );
};