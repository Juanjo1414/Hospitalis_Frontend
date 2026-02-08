import { Link } from 'react-router-dom';
import '../styles/auth-form.css';

export const ForgotPassword = () => {
  return (
    <div className="forgot-page">
      <div className="auth-card forgot">
        <div className="forgot-top" />
        <div className="card-head small">
          <div className="forgot-brand">
            <span className="brand-icon">+</span>
            <span>Hospitalis</span>
          </div>
          <h1>Forgot Password?</h1>
          <p>No worries, we’ll send you reset instructions. Please enter the email associated with your account.</p>
        </div>

        <label className="field">
          <span className="label">Email Address</span>
          <div className="input-with-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L12 13L21 8.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <input type="email" placeholder="doctor@hospitalis.com" />
          </div>
        </label>

        <button className="primary-btn">Send recovery link</button>

        <div className="forgot-note">
          © 2023 Hospitalis Medical Systems.<br />
          Secure &amp; Private.
        </div>

        <p className="auth-footer">
          ← <Link className="link" to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
};
