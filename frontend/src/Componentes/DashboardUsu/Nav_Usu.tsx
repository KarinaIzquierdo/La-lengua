import { useState, useEffect } from "react";
import "./Nav_Usu.css";
import ProfileModal from "../Profile/ProfileModal";
// @ts-ignore
import SettingsModal from "../Settings/SettingsModal";
import { notificationService, type Notificacion } from "../../services/notificationService";

interface NavUsuProps {
  candies: number;
  experience: number;
  onLogout?: () => void;
  onOpenAchievements?: () => void;
}

export default function NavUsu({ candies, experience, onLogout, onOpenAchievements }: NavUsuProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones
  useEffect(() => {
    loadNotifications();
    // Recargar cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getNotificaciones(),
        notificationService.getContadorNoLeidas()
      ]);
      setNotificaciones(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.marcarComoLeida(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.marcarTodasComoLeidas();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Header de navegación */}
      <div className="nav-header">
        <div className="nav-header-inner">
          <div className="nav-logo">
            <img
              src="/Lengua-logo.png"
              alt="La Lengua"
              className="logo-img"
            />
            <span className="logo-text">La Lengua</span>
          </div>
          <div className="nav-actions">
            {/* Sistema de Dulces, Experiencia y Logros */}
            <div className="rewards-section">
              <div className="candy-counter">
                <span className="candy-icon">🍬</span>
                <span className="candy-count">{candies}</span>
              </div>
              <div className="xp-counter">
                <span className="xp-icon">⭐</span>
                <span className="xp-count">{experience} XP</span>
              </div>
              {onOpenAchievements && (
                <button
                  type="button"
                  className="achievements-pill"
                  onClick={onOpenAchievements}
                >
                  <span className="achievements-icon">🏅</span>
                  <span className="achievements-label">Logros</span>
                </button>
              )}
            </div>

            {/* Campanita de Notificaciones */}
            <div className="notifications-container">
              <div className="notification-bell" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>

              {isNotificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notificaciones</h4>
                    {unreadCount > 0 && (
                      <button className="mark-all-read" onClick={handleMarkAllAsRead}>
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notificaciones.length === 0 ? (
                      <div className="no-notifications">
                        <p>No tienes notificaciones</p>
                      </div>
                    ) : (
                      notificaciones.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${!notif.leida ? 'unread' : ''}`}
                          onClick={() => !notif.leida && handleMarkAsRead(notif.id)}
                        >
                          <div className="notification-content">
                            <p className="notification-message">{notif.mensaje}</p>
                            <span className="notification-time">{formatFecha(notif.fecha_creacion)}</span>
                          </div>
                          {!notif.leida && <div className="unread-dot"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="profile-dropdown-container">
              <div className="profile-icon" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-item" onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Ver Perfil
                  </div>
                  <div className="dropdown-item" onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Editar Perfil
                  </div>
                  <div className="dropdown-item" onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsProfileDropdownOpen(false);
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="m12 1 l1.09 3.26 L16 4 l-1.91 2.26 L16 8 l-2.91.74 L12 12 l-1.09-3.26 L8 8 l1.91-2.26 L8 4 l2.91-.74 L12 1z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Configuración
                  </div>
                  <div className="dropdown-divider"></div>
                  {onLogout && (
                    <div className="dropdown-item logout-item" onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onLogout();
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Cerrar Sesión
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </>
  );
}
