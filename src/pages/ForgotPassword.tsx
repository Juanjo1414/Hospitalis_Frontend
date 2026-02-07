import { useState } from 'react';
import { forgotPassword } from '../services/auth.service';

function ForgotPassword(){
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgotPassword(email);
    alert('Si el correo existe, se enviará un enlace de recuperación');
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-6">
        Recuperar Contraseña
      </h1>

      <form onSubmit={handleSubmit}>
        <input
          className="input mb-6"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <button className="button-primary">Enviar</button>
      </form>
    </>
  );
}

export default ForgotPassword;
