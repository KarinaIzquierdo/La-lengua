import React, { useEffect, useMemo, useState } from 'react';
import { authService } from '../../services/authService';

export default function ResetPassword() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emailFromQuery = params.get('email') || '';
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [params]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const value = email.trim();
    if (!value) {
      setStatus({ type: 'error', message: 'Ingresa tu email' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setStatus({ type: 'error', message: 'Por favor, ingresa un email válido' });
      return;
    }
    try {
      setIsLoading(true);
      // 1) Solicitar token/enlace al backend (el backend envía el email automáticamente)
      let resetLink: string | undefined;
      try {
        const req = await authService.requestPasswordReset(value);
        if (req?.reset_link) {
          resetLink = req.reset_link;
          if (resetLink.startsWith('/')) {
            resetLink = `${window.location.origin}${resetLink}`;
          }
        }
      } catch {}

      // 2) Si tenemos token/enlace, llevar de una vez al formulario de nueva contraseña
      if (resetLink) {
        window.location.assign(resetLink);
        return;
      }
      // 3) Si no hubo token (usuario no existe o respuesta genérica), mostrar mensaje
      setStatus({ type: 'success', message: 'Si el correo existe, hemos enviado instrucciones. Revisa tu bandeja y spam.' });
    } catch (e) {
      setStatus({ type: 'error', message: 'No pudimos enviar el correo. Intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16,
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)', padding: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Recuperar contraseña</h2>
          <div style={{ fontSize: 28 }}>🦩</div>
        </div>
        <p style={{ color: '#555', marginTop: 8 }}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <form onSubmit={handleSend}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 6 }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@thelanguage.co"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid #e5e7eb', outline: 'none'
              }}
            />
          </div>
          {status && (
            <div style={{
              background: status.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: status.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${status.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              padding: 10, borderRadius: 8, marginBottom: 12
            }}>
              {status.message}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 10,
              border: 'none', color: '#fff', cursor: 'pointer',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {isLoading ? 'Enviando…' : 'Enviar instrucciones'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
