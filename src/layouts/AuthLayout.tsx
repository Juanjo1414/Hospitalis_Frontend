import '../styles/auth.css';
import { Outlet } from 'react-router-dom';

interface Props {
  children?: React.ReactNode;
}

export const AuthLayout = ({ children }: Props) => {
  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-brand">
          <span className="brand-icon">+</span>
          <span className="brand-text">Hospitalis</span>
        </div>
        <div className="auth-overlay">
          <h2>Managing Healthcare with Excellence</h2>
          <p>
            Experience the next generation of hospital management.
            Streamlined workflows for doctors, better care for patients.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card-wrapper">
          {children}
          <Outlet />
        </div>
      </div>
    </div>
  );
};
