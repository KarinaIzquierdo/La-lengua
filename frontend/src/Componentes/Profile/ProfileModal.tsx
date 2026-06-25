import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  username: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  english_level: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  cedula: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  learning_goals: string;
  correo_personal: string;
  profile_completed: boolean;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<UserProfile>({
    username: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    english_level: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    cedula: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    learning_goals: '',
    correo_personal: '',
    profile_completed: false
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await authService.getUserProfile();
      setProfile(userProfile);
      setFormData(userProfile);
    } catch (err) {
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Actualizar perfil usando el servicio
      const result = await authService.updateUserProfile({
        ...formData,
        profile_completed: true
      });
      
      if (result.success) {
        setProfile({...formData, profile_completed: true});
        setIsEditing(false);
        setSuccess('Perfil actualizado correctamente');
        setTimeout(() => {
          setSuccess('');
          onClose(); // Cerrar modal después de guardar exitosamente
        }, 1500);
      } else {
        setError(result.message || 'Error al actualizar el perfil');
      }
    } catch (err) {
      setError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {
      username: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      english_level: '',
      first_name: '',
      last_name: '',
      birth_date: '',
      cedula: '',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      learning_goals: '',
      correo_personal: '',
      profile_completed: false
    });
    setIsEditing(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Mi Perfil</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="profile-modal-body">
          {loading && <div className="loading">Cargando...</div>}
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {profile && !loading && (
            <div className="profile-content">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>

              <div className="profile-fields">
                <div className="field-group">
                  <label>Usuario</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled
                    />
                  ) : (
                    <div className="field-value">{profile.username}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.email}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Teléfono</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.phone || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>País</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.country || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Ciudad</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.city || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Nivel de Inglés</label>
                  {isEditing ? (
                    <select
                      name="english_level"
                      value={formData.english_level}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar nivel</option>
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                    </select>
                  ) : (
                    <div className="field-value">{profile.english_level || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Nombre</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.first_name || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Apellido</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.last_name || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Fecha de Nacimiento</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.birth_date || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Cédula</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.cedula || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Dirección</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.address || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Contacto de Emergencia</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.emergency_contact || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Teléfono de Emergencia</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="field-value">{profile.emergency_phone || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Objetivos de Aprendizaje</label>
                  {isEditing ? (
                    <textarea
                      name="learning_goals"
                      value={formData.learning_goals}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  ) : (
                    <div className="field-value">{profile.learning_goals || 'No especificado'}</div>
                  )}
                </div>

                <div className="field-group">
                  <label>Correo Personal</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="correo_personal"
                      value={formData.correo_personal}
                      onChange={handleInputChange}
                      placeholder="correo.personal@ejemplo.com"
                    />
                  ) : (
                    <div className="field-value">{profile.correo_personal || 'No especificado'}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-modal-footer">
          {isEditing ? (
            <>
              <button className="btn-cancel" onClick={handleCancel} disabled={loading}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleSave} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              Editar Perfil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
