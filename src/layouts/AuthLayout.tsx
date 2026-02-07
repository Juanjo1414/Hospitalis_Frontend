import { Link, Outlet } from 'react-router-dom';
import logo from '../assets/Logo Hospitalis.png';

function AuthLayout(){
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      
      <img src={logo} alt="Hospitalis Logo" className="w-24 mb-6" />
    
      <div className="card w-full max-w-md">
        <Outlet />
        
        <div className="flex justify-between mt-6 text-sm text-teal-600">
          <Link to="/login">Iniciar sesión</Link>
          <Link to="/register">Registrarse</Link>
          <Link to="/forgot-password">Recuperar contraseña</Link>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
