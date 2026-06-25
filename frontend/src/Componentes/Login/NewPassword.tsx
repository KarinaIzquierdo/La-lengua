import React, { useMemo, useState } from 'react';
import { authService } from '../../services/authService';
import './NewPassword.css';

export default function NewPassword() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return null;
    if (pass.length < 8) return 'weak';
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return 'strong';
    return 'medium';
  };
  
  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ type: 'error', message: 'Token inválido o ausente. Revisa tu enlace de correo.' });
      return;
    }
    if (!password || !confirm) {
      setStatus({ type: 'error', message: 'Completa ambos campos.' });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.resetPassword(token, password);
      if (res.success) {
        setStatus({ type: 'success', message: res.message || 'Contraseña actualizada. Ya puedes iniciar sesión.' });
      } else {
        setStatus({ type: 'error', message: res.message || 'No se pudo actualizar la contraseña.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error de conexión. Intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-password-container">
      <div className="new-password-card">
        <div className="new-password-header">
          <div className="lock-icon">🔒</div>
          <h2>Nueva Contraseña</h2>
          <p>Ingresa tu nueva contraseña para terminar el proceso de recuperación</p>
        </div>

        <form onSubmit={handleSubmit} className="new-password-form">
          <div className="form-group">
            <label htmlFor="password">Nueva contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div className={`strength-fill strength-${passwordStrength}`}></div>
                </div>
                <span style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  {passwordStrength === 'weak' && '⚠️ Contraseña débil'}
                  {passwordStrength === 'medium' && '⚡ Contraseña media'}
                  {passwordStrength === 'strong' && '✅ Contraseña fuerte'}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
          </div>

          {status && (
            <div className={`status-message status-${status.type}`}>
              <span className="status-message-icon">
                {status.type === 'success' ? '✅' : '❌'}
              </span>
              <span>{status.message}</span>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? '⏳ Guardando...' : '🔐 Guardar Nueva Contraseña'}
          </button>
        </form>

        <div className="security-tips">
          <h4>🛡️ Consejos de Seguridad</h4>
          <ul>
            <li>Usa al menos 8 caracteres</li>
            <li>Incluye mayúsculas y números</li>
            <li>Evita usar información personal</li>
          </ul>
        </div>

        <div className="back-link">
          <a href="/">← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
