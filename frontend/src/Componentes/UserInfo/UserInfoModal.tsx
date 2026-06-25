import { useState } from "react";
import "./UserInfoModal.css";
import { authService } from "../../services/authService";

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function UserInfoModal({ isOpen, onClose, onComplete }: UserInfoModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    cedula: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    emergencyContact: '',
    emergencyPhone: '',
    englishLevel: 'beginner',
    learningGoals: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.firstName || !formData.lastName || !formData.birthDate || !formData.cedula) {
      setMessage('Los campos marcados con * son obligatorios');
      setMessageType('error');
      return;
    }

    // Validar formato de cédula (ejemplo básico)
    if (formData.cedula.length < 7) {
      setMessage('La cédula debe tener al menos 7 caracteres');
      setMessageType('error');
      return;
    }

    // Validar fecha de nacimiento (mínimo 10 años)
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 10) {
      setMessage('Debes tener al menos 10 años para registrarte');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Aquí llamarías a la API para guardar la información adicional
      const result = await authService.updateUserProfile(formData);
      
      if (result.success) {
        setMessage('Información guardada exitosamente');
        setMessageType('success');
        
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setMessage(result.message || 'Error al guardar la información');
        setMessageType('error');
      }
      
    } catch (error: any) {
      setMessage('Error al guardar la información');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="userinfo-modal-overlay">
      <div className="userinfo-modal">
        <div className="userinfo-modal-header">
          <h2>¡Completa tu perfil!</h2>
          <p>Para brindarte la mejor experiencia de aprendizaje, necesitamos algunos datos adicionales</p>
        </div>

        <div className="userinfo-modal-content">
          <form onSubmit={handleSubmit} className="userinfo-form">
            {/* Información Personal */}
            <div className="form-section">
              <h3>Información Personal</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nombre *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Apellido *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Tu apellido"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="birthDate">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cedula">Cédula/ID *</label>
                  <input
                    type="text"
                    id="cedula"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    placeholder="Número de identificación"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="form-section">
              <h3>Información de Contacto</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Teléfono</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+57 300 123 4567"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">Ciudad</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Tu ciudad"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Dirección</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Tu dirección completa"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">País</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona tu país</option>
                  <option value="colombia">Colombia</option>
                  <option value="venezuela">Venezuela</option>
                  <option value="ecuador">Ecuador</option>
                  <option value="peru">Perú</option>
                  <option value="mexico">México</option>
                  <option value="argentina">Argentina</option>
                  <option value="chile">Chile</option>
                  <option value="otros">Otro</option>
                </select>
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="form-section">
              <h3>Contacto de Emergencia</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="emergencyContact">Nombre del Contacto</label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Nombre completo"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="emergencyPhone">Teléfono de Emergencia</label>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    placeholder="+57 300 123 4567"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Información Académica */}
            <div className="form-section">
              <h3>Información de Aprendizaje</h3>
              <div className="form-group">
                <label htmlFor="englishLevel">Nivel de Inglés Actual</label>
                <select
                  id="englishLevel"
                  name="englishLevel"
                  value={formData.englishLevel}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                >
                  <option value="beginner">Principiante</option>
                  <option value="elementary">Básico</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="upper-intermediate">Intermedio Alto</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="learningGoals">Objetivos de Aprendizaje</label>
                <textarea
                  id="learningGoals"
                  name="learningGoals"
                  value={formData.learningGoals}
                  onChange={handleInputChange}
                  placeholder="¿Por qué quieres aprender inglés? ¿Cuáles son tus metas?"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </div>

            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Completar Perfil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
