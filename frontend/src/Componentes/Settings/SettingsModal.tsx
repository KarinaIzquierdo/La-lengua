import { useState } from "react";
import "./SettingsModal.css";
import { authService } from "../../services/authService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage('Todos los campos son obligatorios');
      setMessageType('error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Las contraseñas nuevas no coinciden');
      setMessageType('error');
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('La nueva contraseña debe tener al menos 6 caracteres');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await authService.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      });

      if (result.success) {
        setMessage('Contraseña cambiada exitosamente');
        setMessageType('success');
        
        // Limpiar formulario después de 2 segundos
        setTimeout(() => {
          setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setMessage('');
          onClose();
        }, 2000);
      } else {
        setMessage(result.message || 'Error al cambiar la contraseña');
        setMessageType('error');
      }
      
    } catch (error: any) {
      setMessage(error.message || 'Error al cambiar la contraseña');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={handleClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Configuración</h2>
          <button className="close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="settings-modal-content">
          <div className="settings-section">
            <h3>Cambiar Contraseña</h3>
            <p>Actualiza tu contraseña para mantener tu cuenta segura</p>
            
            <form onSubmit={handleSubmit} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Contraseña Actual</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Ingresa tu contraseña actual"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Nueva Contraseña</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Ingresa tu nueva contraseña"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirma tu nueva contraseña"
                  disabled={isSubmitting}
                />
              </div>

              {message && (
                <div className={`message ${messageType}`}>
                  {message}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
