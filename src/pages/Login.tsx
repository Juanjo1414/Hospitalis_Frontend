import { useState } from 'react';
import { loginUser } from '../services/auth.service';

function Login(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginUser({ email, password });
      localStorage.setItem('token', res.data.accessToken);
      alert('Login exitoso');
    } catch {
      alert('Credenciales inválidas');
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>

      <form onSubmit={handleSubmit}>
        <input
          className="input mb-4"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          className="input mb-6"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button className="button-primary">Ingresar</button>
      </form>
    </>
  );
}

export default Login;
