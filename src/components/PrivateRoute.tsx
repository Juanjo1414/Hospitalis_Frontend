import { Navigate, Outlet } from 'react-router-dom';

/**
 * PrivateRoute — protege rutas que requieren autenticación.
 * Si no hay accessToken en localStorage → redirige a /login.
 * Si hay token → renderiza la ruta normalmente.
 */
export const PrivateRoute = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    // Redirige a login y reemplaza el historial
    // para que el botón "atrás" no vuelva a la ruta protegida
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};