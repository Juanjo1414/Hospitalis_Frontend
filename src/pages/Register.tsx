import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/auth.css';
import { registerUser } from '../services/auth.service';

const SPECIALTIES = [
  'Cardiología',
  'Dermatología',
  'Medicina de Urgencias',
  'Medicina Familiar',
  'Gastroenterología',
  'Cirugía General',
  'Medicina Interna',
  'Neurología',
  'Obstetricia y Ginecología',
  'Oncología',
  'Ortopedia',
  'Pediatría',
  'Psiquiatría',
  'Neumología',
  'Radiología',
  'Urología',
];

export const Register = () => {
  const navigate = useNavigate();
  const [fullName,         setFullName]         = useState('');
  const [email,            setEmail]            = useState('');
  const [specialty,        setSpecialty]        = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [acceptTerms,      setAcceptTerms]      = useState(false);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [error,            setError]            = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!acceptTerms) {
      setError('Debes aceptar los Términos de Servicio y la Política de Privacidad.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({ fullName, email, password, specialty });
      navigate('/login');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(message ?? 'No se pudo completar el registro. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-body">
        <div className="register-card">

          {/* Encabezado */}
          <div className="register-card-head">
            <div className="head-icon">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <h1>Registro de Médico</h1>
            <p>Ingresa tus datos profesionales para unirte a la red Hospitalis.</p>
          </div>

          <form onSubmit={handleSubmit} className="register-fields">

            {/* Nombre completo */}
            <div className="auth-field">
              <label htmlFor="fullName">Nombre Completo</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">person</span>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Correo */}
            <div className="auth-field">
              <label htmlFor="reg-email">Correo Electrónico</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">mail</span>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="nombre@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Especialidad */}
            <div className="auth-field">
              <label htmlFor="specialty">Especialidad Médica</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">stethoscope</span>
                <select
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  style={{ paddingLeft: 44 }}
                >
                  <option value="">Selecciona tu especialidad...</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contraseña + Confirmar — dos columnas */}
            <div className="grid-2col">
              <div className="auth-field">
                <label htmlFor="reg-password">Contraseña</label>
                <div className="input-wrap">
                  <span className="input-icon material-symbols-outlined">lock</span>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <div className="input-wrap">
                  <span className="input-icon material-symbols-outlined">lock_reset</span>
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" className="input-action" onClick={() => setShowConfirm(!showConfirm)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showConfirm ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Términos */}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                Acepto los{' '}
                <a href="#" className="auth-link">Términos de Servicio</a>
                {' '}y la{' '}
                <a href="#" className="auth-link">Política de Privacidad</a>.
              </span>
            </label>

            {/* Error */}
            {error && (
              <div className="auth-error">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
            </button>

            <p className="register-footer-text">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
            </p>
          </form>

        </div>
      </div>

      <div className="register-page-footer">
        © 2026 Hospitalis Systems. Todos los derechos reservados.
      </div>
    </div>
  );
};