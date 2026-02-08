import { Link } from 'react-router-dom';
import '../styles/auth-form.css';

export const Login = () => {
  return (
      <div className="auth-form">
        <div className="auth-brand">
          <div className="logo">Hospitalis</div>
          <button className="ghost">Log In</button>
        </div>

        <h1>Welcome back</h1>
        <p>Please enter your details to access the doctor dashboard.</p>

        <label className="field">
          <span className="label">Email Address</span>
          <div className="input-with-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L12 13L21 8.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <input type="email" placeholder="name@hospitalis.com" />
          </div>
        </label>

        <label className="field">
          <span className="label">Password</span>
          <div className="input-with-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 11V7a5 5 0 00-10 0v4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="11" width="18" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <input type="password" placeholder="Enter your password" />
            <button className="icon-btn" aria-label="toggle-password">👁️</button>
          </div>
        </label>

        <div className="row-between">
          <label className="remember"><input type="checkbox" /> Remember me</label>
          <Link className="forgot" to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="primary-btn">Log In</button>

        <div className="auth-footer">
          Don’t have an account? <Link className="link" to="/register">Register</Link>
          <div className="meta-links">
            <span>Support</span>
            <span>Privacy Policy</span>
          </div>
          <div className="meta-links">© 2024 Hospitalis Inc.</div>
        </div>
      </div>
  );
};
