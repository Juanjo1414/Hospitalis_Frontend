import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/auth.css';
import { loginUser } from '../services/auth.service';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginUser({ email, password });
      const token = response?.data?.accessToken;
      const user = response?.data?.user;

      if (token) {
        localStorage.setItem('accessToken', token);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(message ?? 'Unable to login. Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left: Hero imagen médico ── */}
      <div className="login-hero">
        <img
          src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=900&auto=format&fit=crop&q=80"
          alt="Doctor profesional en hospital"
        />
        <div className="login-hero-overlay" />

        <div className="login-hero-brand">
          <div className="brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              local_hospital
            </span>
          </div>
          Hospitalis
        </div>

        <div className="login-hero-text">
          <h2>Managing Healthcare with Excellence</h2>
          <p>
            Experience the next generation of hospital management.
            Streamlined workflows for doctors, better care for patients.
          </p>
        </div>
      </div>

      {/* ── Right: Formulario ── */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="login-header">
            <h1>Welcome back</h1>
            <p>Please enter your details to access the doctor dashboard.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@hospitalis.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me / Forgot */}
            <div className="login-row-between">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>
                Forgot password?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  error
                </span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Register
              </Link>
            </p>

            <div className="login-meta">
              <a href="#">Support</a>
              <span>·</span>
              <a href="#">Privacy Policy</a>
              <span>·</span>
              <span>© 2026 Hospitalis Inc.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};