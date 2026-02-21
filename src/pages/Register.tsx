import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/auth.css';
import { registerUser } from '../services/auth.service';

const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Family Medicine',
  'Gastroenterology',
  'General Surgery',
  'Internal Medicine',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Urology',
];

export const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({ fullName, email, password, specialty });
      navigate('/login');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(message ?? 'Unable to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      {/* ── Topbar ── */}
      <header className="register-topbar">
        <div className="hospitalis-brand">
          <div className="brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              local_hospital
            </span>
          </div>
          Hospitalis
        </div>
        <Link to="/login" className="btn-ghost">Log In</Link>
      </header>

      {/* ── Body ── */}
      <div className="register-body">
        <div className="register-card">
          {/* Card header */}
          <div className="register-card-head">
            <div className="head-icon">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <h1>Doctor Registration</h1>
            <p>Enter your professional details to join the Hospitalis network.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="register-fields"
          >
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">person</span>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">mail</span>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="name@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Medical Specialty */}
            <div className="auth-field">
              <label htmlFor="specialty">Medical Specialty</label>
              <div className="input-wrap">
                <span className="input-icon material-symbols-outlined">stethoscope</span>
                <select
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  style={{ paddingLeft: 44 }}
                >
                  <option value="">Select your specialty...</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password + Confirm — dos columnas */}
            <div className="grid-2col">
              <div className="auth-field">
                <label htmlFor="reg-password">Password</label>
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
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
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
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showConfirm ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                I agree to the{' '}
                <a href="#" className="auth-link">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="auth-link">Privacy Policy</a>.
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
              {isSubmitting ? 'Registering...' : 'Register Account'}
            </button>

            <p className="register-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Log in here</Link>
            </p>
          </form>
        </div>
      </div>

      <div className="register-page-footer">
        © 2024 Hospitalis Systems. All rights reserved.
      </div>
    </div>
  );
};