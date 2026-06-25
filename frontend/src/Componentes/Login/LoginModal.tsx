import React, { useState } from 'react';
import './LoginModal.css';
import { authService } from '../../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { email: string; password: string }) => void;
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onLogin(formData);
    } catch (error) {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReset = () => {
    setShowReset(true);
    setResetEmail(formData.email || '');
    setResetStatus(null);
    setResetLink(null);
  };

  const handleSendReset = async () => {
    setResetStatus(null);
    const email = (resetEmail || formData.email || '').trim();
    if (!email) {
      setResetStatus({ type: 'error', message: 'Ingresa tu email para continuar' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResetStatus({ type: 'error', message: 'Por favor, ingresa un email válido' });
      return;
    }
    try {
      // 1) Solicitar token y enlace reales al backend
      let resetLink: string | undefined;
      try {
        const req = await authService.requestPasswordReset(email);
        // En backend devolvemos reset_link en dev para conveniencia
        if (req && (req as any).reset_link) {
          resetLink = (req as any).reset_link as string;
          // Asegurar absoluto en UI también
          if (resetLink.startsWith('/')) {
            resetLink = `${window.location.origin}${resetLink}`;
          }
          setResetLink(resetLink);
        }
      } catch (e) {
        // No bloquear el flujo: si falla, seguiremos con fallback dentro de emailService
      }

      // Si no obtuvimos token/enlace, mostrar error
      if (!resetLink) {
        setResetStatus({ type: 'error', message: 'No encontramos este correo o no pudimos generar el enlace. Verifica el email e inténtalo nuevamente.' });
        return;
      }

      // El backend ya envió el email automáticamente
      setResetStatus({ type: 'success', message: 'Hemos enviado un correo con instrucciones para recuperar tu contraseña.' });
    } catch (e) {
      setResetStatus({ type: 'error', message: 'No pudimos enviar el correo de recuperación.' });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="login-modal-backdrop" onClick={handleBackdropClick}>
      <div className="login-modal">
        <div className="login-modal-header">
          <h2>Iniciar Sesión</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="login-modal-body">
          <div className="login-welcome">
            <div className="flamingo-icon">
              <img src="/Lengua-logo.png" alt="La Lengua" style={{ width: '80px', height: 'auto' }} />
            </div>
            <p>¡Bienvenido de vuelta! Aprende inglés de forma dinámica y divertida</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Personal</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tucorreo@gmail.com"
                className="login-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Ingresa tu contraseña"
                className="login-input"
                disabled={isLoading}
              />
              <div style={{ marginTop: 8 }}>
                <button type="button" className="link-button" onClick={handleOpenReset}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="login-footer">
            <p>¿No tienes credenciales? <a href="#contact">Contáctanos</a></p>
          </div>
        </div>
      </div>
    </div>
    {showReset && (
      <div className="login-modal-backdrop" onClick={handleBackdropClick}>
        <div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="login-modal-header">
            <h2 id="reset-title">Recuperar contraseña</h2>
            <button className="close-button" onClick={() => setShowReset(false)}>×</button>
          </div>
          <div className="login-modal-body">
            <p>Te enviaremos un correo con instrucciones para restablecer tu contraseña.</p>
            <div className="form-group">
              <label htmlFor="reset-email">Correo Personal</label>
              <input
                type="email"
                id="reset-email"
                name="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="login-input"
              />
            </div>
            {resetStatus && (
              <div className={resetStatus.type === 'success' ? 'success-message' : 'error-message'}>
                {resetStatus.message}
              </div>
            )}
            {/* Oculto: se elimina el fallback visual del enlace directo por solicitud */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="button" className="login-button" onClick={handleSendReset}>
                Enviar correo
              </button>
              <button type="button" className="secondary-button" onClick={() => setShowReset(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
