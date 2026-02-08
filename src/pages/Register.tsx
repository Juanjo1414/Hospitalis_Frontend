import { Link } from 'react-router-dom';
import '../styles/auth-form.css';

export const Register = () => {
  return (
    <div className="register-page">
      <div className="register-topbar">
        <div className="brand">
          <span className="brand-icon">+</span>
          <span>Hospitalis</span>
        </div>
        <Link className="ghost" to="/login">Log In</Link>
      </div>

      <div className="auth-card register">
        <div className="card-head">
          <div className="icon">+</div>
          <h1>Doctor Registration</h1>
          <p>Enter your professional details to join the Hospitalis network.</p>
        </div>

        <label className="field">
          <span className="label">Full Name</span>
          <div className="input-with-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M4 20a8 8 0 0116 0" stroke="#9CA3AF" strokeWidth="1.5"/></svg>
            <input type="text" placeholder="Dr. Jane Doe" />
          </div>
        </label>

        <label className="field">
          <span className="label">Email Address</span>
          <div className="input-with-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L12 13L21 8.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <input type="email" placeholder="name@hospitalis.com" />
          </div>
        </label>

        <label className="field">
          <span className="label">Medical Specialty</span>
          <div className="input-with-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v16M4 12h16" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <select>
              <option>Select your specialty...</option>
              <option>General Medicine</option>
              <option>Cardiology</option>
              <option>Pediatrics</option>
              <option>Neurology</option>
            </select>
          </div>
        </label>

        <div className="two-col">
          <label className="field">
            <span className="label">Password</span>
            <div className="input-with-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 11V7a5 5 0 00-10 0v4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="11" width="18" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/></svg>
              <input type="password" placeholder="••••••••" />
            </div>
          </label>

          <label className="field">
            <span className="label">Confirm Password</span>
            <div className="input-with-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 11V7a5 5 0 00-10 0v4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="11" width="18" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/></svg>
              <input type="password" placeholder="••••••••" />
            </div>
          </label>
        </div>

        <label className="terms">
          <input type="checkbox" />
          I agree to the <span className="link">Terms of Service</span> and <span className="link">Privacy Policy</span>
        </label>

        <button className="primary-btn">Register Account</button>

        <p className="auth-footer">
          Already have an account? <Link className="link" to="/login">Log in here</Link>
        </p>
      </div>

      <div className="register-footer">© 2023 Hospitalis Systems. All rights reserved.</div>
    </div>
  );
};
