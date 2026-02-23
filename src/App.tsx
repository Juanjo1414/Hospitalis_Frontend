import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Appointments } from './pages/Appointments';
import { PrivateRoute } from './components/PrivateRoute';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Rutas públicas ─────────────────────────────── */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── Rutas protegidas (requieren accessToken) ───── */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/patients"     element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          {/* Sprint 3 */}
          {/* <Route path="/medical-records/:patientId" element={<MedicalRecords />} /> */}
        </Route>

        {/* 404 → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;