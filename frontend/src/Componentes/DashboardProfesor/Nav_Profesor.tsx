import { useState, useEffect } from 'react';
import './Nav_Profesor.css';
import { notificacionService } from '../../services/notificacionService';

interface NavProfesorProps {
  profesorData: {
    nombre: string;
    especialidad: string;
    initials?: string;
  };
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout?: () => void;
}

export default function NavProfesor({ profesorData, activeView, setActiveView, onLogout }: NavProfesorProps) {
  const [noLeidasCount, setNoLeidasCount] = useState(0);

  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const response = await notificacionService.obtenerNotificaciones();
        if (response.success) {
          setNoLeidasCount(response.no_leidas);
        }
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      }
    };

    cargarNotificaciones();
    // Actualizar cada minuto
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar contador cuando se abre el panel de notificaciones
  useEffect(() => {
    if (activeView === 'notificaciones') {
      const actualizarContador = async () => {
        try {
          const response = await notificacionService.obtenerNotificaciones();
          if (response.success) {
            setNoLeidasCount(response.no_leidas);
          }
        } catch (error) {
          console.error('Error al actualizar contador:', error);
        }
      };
      
      // Actualizar inmediatamente al abrir
      actualizarContador();
      
      // Actualizar cada 5 segundos mientras esté abierto
      const intervalNotif = setInterval(actualizarContador, 5000);
      return () => clearInterval(intervalNotif);
    }
  }, [activeView]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'clases', label: 'Mis Clases', icon: '📚' },
    { id: 'programar-clase', label: 'Programar Clase', icon: '➕' },
    { id: 'drive-evaluaciones', label: 'Evaluaciones (Drive)', icon: '📁' },
    { id: 'calificar-evaluaciones', label: 'Calificar Evaluaciones', icon: '✅' },
    { id: 'reportes', label: 'Reportes de Progreso', icon: '📋' },
    { id: 'misiones', label: 'Misiones', icon: '🎯' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔', badge: noLeidasCount > 0 ? noLeidasCount : undefined },
    { id: 'estudiantes', label: 'Estudiantes', icon: '👥' },
    { id: 'historial-asistencias', label: 'Historial Asistencias', icon: '📝' },
    { id: 'mis-clubs', label: 'Mis Clubs', icon: '🏷️' },
    { id: 'gestion-clb', label: 'Gestión CLB', icon: '📂' }
  ];

  return (
    <aside className="sidebar-profesor">
      <div>
        <div className="sidebar-header">
          <h3>Panel Profesor</h3>
          <div className="profesor-info">
            <div className="profesor-avatar">
              {profesorData.initials || profesorData.nombre.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="profesor-details">
              <span className="profesor-name">{profesorData.nombre}</span>
              <span className="profesor-role">{profesorData.especialidad}</span>
            </div>
          </div>
        </div>
        
        <ul className="sidebar-nav">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={activeView === item.id ? 'active' : ''}
                onClick={() => setActiveView(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        
        <button className="logout-button" onClick={onLogout} style={{ marginTop: '2rem', width: '100%' }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
