import { useState } from 'react';
import { registerUser } from '../services/auth.service';

function Register(){
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser({ fullName, email, password });
      alert('Usuario registrado correctamente');
    } catch {
      alert('Error al registrar usuario');
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-6">Registro</h1>

      <form onSubmit={handleSubmit}>
        <input className="input mb-4" placeholder="Nombre completo"
          value={fullName} onChange={e => setFullName(e.target.value)} />

        <input className="input mb-4" type="email" placeholder="Correo"
          value={email} onChange={e => setEmail(e.target.value)} />

        <input className="input mb-6" type="password" placeholder="Contraseña"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button className="button-primary">Registrarse</button>
      </form>
    </>
  );
}

export default Register;
