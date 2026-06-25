import { useState, useEffect } from 'react';
import './NotificacionesProfesor.css';
import { notificacionService, type Notificacion } from '../../services/notificacionService';

export default function NotificacionesProfesor() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('todas');
  const [mostrarSoloNoLeidas, setMostrarSoloNoLeidas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noLeidasCount, setNoLeidasCount] = useState(0);

  useEffect(() => {
    // Solo cargar notificaciones si hay un token de autenticación
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }

    cargarNotificaciones();
    // Actualizar notificaciones cada 30 segundos
    const interval = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const cargarNotificaciones = async () => {
    // Verificar que haya token antes de hacer la petición
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await notificacionService.obtenerNotificaciones();
      
      if (response.success) {
        setNotificaciones(response.notificaciones);
        setNoLeidasCount(response.no_leidas);
      } else {
        setError(response.message || 'Error al cargar notificaciones');
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id: number) => {
    try {
      const response = await notificacionService.marcarComoLeida(id);
      if (response.success) {
        setNotificaciones(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, leida: true } : notif
          )
        );
        setNoLeidasCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const response = await notificacionService.marcarTodasComoLeidas();
      if (response.success) {
        setNotificaciones(prev => 
          prev.map(notif => ({ ...notif, leida: true }))
        );
        setNoLeidasCount(0);
      }
    } catch (err) {
      console.error('Error al marcar todas las notificaciones como leídas:', err);
    }
  };

  const eliminarNotificacion = (id: number) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id));
  };

  const notificacionesFiltradas = notificaciones
    .filter(notif => filtroTipo === 'todas' || notif.tipo === filtroTipo)
    .filter(notif => !mostrarSoloNoLeidas || !notif.leida)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const obtenerIconoTipo = (tipo: string) => {
    return notificacionService.getIconoTipo(tipo);
  };


  return (
    <div className="notificaciones-profesor">
      <div className="notificaciones-header">
        <h2>🔔 Notificaciones {noLeidasCount > 0 && <span className="badge-count">{noLeidasCount}</span>}</h2>
        <div className="notificaciones-controles">
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-select"
          >
            <option value="todas">Todas</option>
            <option value="clase_hoy">Clases Hoy</option>
            <option value="clase_proxima">Clases Próximas</option>
            <option value="evaluacion_subida">Evaluaciones Subidas</option>
            <option value="evaluacion_pendiente">Pendientes Calificar</option>
            <option value="evaluacion_vencida">Evaluaciones Vencidas</option>
          </select>
          
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={mostrarSoloNoLeidas}
              onChange={(e) => setMostrarSoloNoLeidas(e.target.checked)}
            />
            Solo no leídas
          </label>
          
          <button 
            onClick={marcarTodasComoLeidas}
            className="btn-marcar-todas"
            disabled={noLeidasCount === 0}
          >
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-notificaciones">
          <div className="spinner"></div>
          <p>Cargando notificaciones...</p>
        </div>
      )}

      {error && (
        <div className="error-notificaciones">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={cargarNotificaciones} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="notificaciones-lista">
          {notificacionesFiltradas.length === 0 ? (
            <div className="sin-notificaciones">
              <div className="sin-notificaciones-icon">🔕</div>
              <h3>No hay notificaciones</h3>
              <p>Todas las notificaciones están al día</p>
            </div>
          ) : (
            notificacionesFiltradas.map(notificacion => (
            <div 
              key={notificacion.id} 
              className={`notificacion-item ${notificacion.leida ? 'leida' : 'no-leida'} prioridad-${notificacion.prioridad}`}
              onClick={() => !notificacion.leida && marcarComoLeida(notificacion.id)}
              style={{
                borderLeftColor: notificacionService.getColorPrioridad(notificacion.prioridad)
              }}
            >
              <div className="notificacion-icono">
                {obtenerIconoTipo(notificacion.tipo)}
              </div>
              
              <div className="notificacion-contenido">
                <div className="notificacion-header-item">
                  <h4>{notificacion.titulo}</h4>
                  <span className="notificacion-tiempo">
                    {notificacion.tiempo_transcurrido}
                  </span>
                </div>
                
                <p className="notificacion-mensaje">
                  {notificacionService.formatearMensaje(notificacion)}
                </p>
                
                {notificacion.estudiante_nombre && (
                  <span className="notificacion-estudiante">
                    👤 {notificacion.estudiante_nombre}
                  </span>
                )}
                
                {notificacion.clase_nombre && (
                  <span className="notificacion-clase">
                    📚 {notificacion.clase_nombre}
                  </span>
                )}
                
                {notificacion.evaluacion_titulo && (
                  <span className="notificacion-evaluacion">
                    📝 {notificacion.evaluacion_titulo}
                  </span>
                )}
              </div>
              
              <div className="notificacion-acciones">
                {!notificacion.leida && (
                  <button 
                    className="btn-marcar-leida"
                    onClick={(e) => {
                      e.stopPropagation();
                      marcarComoLeida(notificacion.id);
                    }}
                    title="Marcar como leída"
                  >
                    ✓
                  </button>
                )}
                
                <button 
                  className="btn-eliminar"
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarNotificacion(notificacion.id);
                  }}
                  title="Eliminar notificación"
                >
                  ✕
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
