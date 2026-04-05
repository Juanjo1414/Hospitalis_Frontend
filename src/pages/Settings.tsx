import { useState, useEffect } from 'react';
import { User, Mail, Shield, Lock, Briefcase, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { updateProfile, getProfileInfo } from '../services/users.service';

export const Settings = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    specialty: '',
    currentPassword: '',
    newPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Extraer userId del JWT
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = payload.sub;
        setUserId(id);
        fetchProfile();
      } catch (err) {
        console.error('Error decoding token', err);
        setFetching(false);
      }
    } else {
      setFetching(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfileInfo();
      setFormData({
        fullname: res.data.fullname || '',
        email: res.data.email || '',
        specialty: res.data.specialty || '',
        currentPassword: '',
        newPassword: '',
      });
    } catch (error) {
      console.error('Error fetching profile', error);
      setMessage({ type: 'error', text: 'Error al cargar los datos del perfil' });
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage(null); // Limpiar mensaje al escribir
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updatePayload: any = {
        fullname: formData.fullname,
        email: formData.email,
        specialty: formData.specialty,
      };

      if (formData.newPassword) {
        updatePayload.password = formData.newPassword;
        updatePayload.currentPassword = formData.currentPassword;
      }

      await updateProfile(userId, updatePayload);
      
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' })); // Limpiar campos de contraseña

      // Notificar al DashboardLayout para que actualice el nombre en la barra lateral
      window.dispatchEvent(new Event('profileUpdated'));

    } catch (error: any) {
      const errText = error.response?.data?.message || 'Error al actualizar el perfil';
      setMessage({ type: 'error', text: errText });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="empty-state"><p>Cargando perfil...</p></div>;
  }

  return (
    <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="welcome-banner">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <User color="var(--primary)" size={26} />
          Configuración Personal de Usuario
        </h1>
        <p>Actualiza tu información y credenciales de acceso</p>
      </div>

      {message && (
        <div style={{
          padding: '14px 18px',
          marginBottom: '24px',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: 500,
          background: message.type === 'success' ? 'var(--green-bg)' : 'var(--red-bg)',
          color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
          border: `1px solid ${message.type === 'success' ? 'var(--green-border)' : 'var(--red-border)'}`
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: 0 }}>
        {/* Encabezado Visual de la Tarjeta */}
        <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--primary), #4da6ff)' }} />
        
        <div className="card-body" style={{ padding: '32px' }}>
          
          {/* SECCIÓN DATOS PERSONALES */}
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px' }}>
            Datos Personales
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '20px', marginBottom: '32px' }}>
            
            <div className="auth-field">
              <label>Nombre Completo</label>
              <div className="input-wrap">
                <User className="input-icon" size={20} />
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Correo Electrónico</label>
              <div className="input-wrap">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@hospitalis.com"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Especialidad / Rol</label>
              <div className="input-wrap">
                <Briefcase className="input-icon" size={20} />
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="Ej. Cardiología"
                />
              </div>
            </div>
            
          </div>

          {/* SECCIÓN SEGURIDAD */}
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--primary)" />
            Seguridad y Acceso
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '20px' }}>
            <div className="auth-field">
              <label>Contraseña Actual</label>
              <div className="input-wrap">
                <Lock className="input-icon" size={20} />
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Solo requerida si cambias tu contraseña"
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Nueva Contraseña</label>
              <div className="input-wrap">
                <Shield className="input-icon" size={20} />
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER DEL FORM */}
        <div style={{ background: 'var(--bg-surface-2)', padding: '20px 32px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)' }}>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '0 24px' }}>
            {loading ? 'Guardando...' : (
              <>
                <Save size={18} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};