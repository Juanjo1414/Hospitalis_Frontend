import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login }           from './pages/Login';
import { Register }        from './pages/Register';
import { ForgotPassword }  from './pages/ForgotPassword';
import { Dashboard }       from './pages/Dashboard';
import { Patients }        from './pages/Patients';
import { Appointments }    from './pages/Appointments';
import { MedicalRecords }  from './pages/MedicalRecords';
import { Messages }        from './pages/Messages';
import { Pharmacy }        from './pages/Pharmacy';
import { Settings }        from './pages/Settings';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout }      from './layouts/AuthLayout';
import { PrivateRoute }    from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect raíz */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas de autenticación */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Rutas protegidas — todas dentro del DashboardLayout */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/patients"     element={<Patients />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/messages"     element={<Messages />} />
            <Route path="/pharmacy"     element={<Pharmacy />} />
            <Route path="/settings"     element={<Settings />} />

            {/* HOSP-45 / HOSP-47: Historial médico y notas clínicas */}
            <Route path="/patients/:patientId/history" element={<MedicalRecords />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;