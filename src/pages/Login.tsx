import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/auth.css';
import { loginUser } from '../services/auth.service';

export const Login = () => {
  const navigate = useNavigate();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await loginUser({ email, password });
      const token = response?.data?.accessToken;
      const user  = response?.data?.user;
      if (token) localStorage.setItem('accessToken', token);
      if (user)  localStorage.setItem('user', JSON.stringify(user));
      if (rememberMe) localStorage.setItem('rememberMe', 'true');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(message ?? 'No se pudo iniciar sesión. Verifica tus credenciales e intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── Izquierda: Hero ── */}
      <div className="login-hero">
        <img
          src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=900&auto=format&fit=crop&q=80"
          alt="Médico profesional en hospital"
        />
        <div className="login-hero-overlay" />

        <div className="login-hero-brand">
          <div className="brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>Cardiology</span>
          </div>
          Hospitalis
        </div>

        <div className="login-hero-text">
          <h2>Gestión Hospitalaria con Excelencia</h2>
          <p>
            Experimenta la próxima generación en administración hospitalaria.
            Flujos de trabajo optimizados para médicos, mejor atención para los pacientes.
          </p>
        </div>
      </div>

      {/* ── Derecha: Formulario ── */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="login-header">
            <h1>Bienvenido de nuevo</h1>
            <p>Ingresa tus datos para acceder al panel médico.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Correo */}
            <div className="auth-field">
              <label htmlFor="email">Correo Electrónico</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="nombre@hospitalis.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="auth-field">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
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

            {/* Recordarme / Olvidé contraseña */}
            <div className="login-row-between">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Recordarme
              </label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="auth-link">Regístrate</Link>
            </p>
            <div className="login-meta">
              <a href="#">Soporte</a>
              <span>·</span>
              <a href="#">Política de Privacidad</a>
              <span>·</span>
              <span>© 2026 Hospitalis Inc.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};