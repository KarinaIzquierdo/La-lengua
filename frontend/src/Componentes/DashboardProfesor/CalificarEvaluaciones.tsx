import React, { useState, useEffect } from 'react';
import { calificacionService, type PanelCalificacionItem } from '../../services/calificacionService';
import './CalificarEvaluaciones.css';

interface CalificarEvaluacionesProps {}

export default function CalificarEvaluaciones({}: CalificarEvaluacionesProps) {
  const [activeTab, setActiveTab] = useState<'por-calificar' | 'calificadas'>('por-calificar');
  const [items, setItems] = useState<PanelCalificacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarPanel();
  }, []);

  const cargarPanel = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await calificacionService.obtenerPanelCalificaciones();
      if (!response.success) {
        setError(response.error || 'Error al cargar panel de calificaciones');
        setItems([]);
        return;
      }

      setItems(response.items);

      // Inicializar notas y comentarios con los valores existentes
      const inicialNotas: Record<string, string> = {};
      const inicialComentarios: Record<string, string> = {};
      response.items.forEach((item) => {
        const key = `${item.evaluacion_id}-${item.estudiante_id}`;
        if (item.calificacion !== null) {
          inicialNotas[key] = item.calificacion.toString();
        }
        if ((item as any).comentarios_profesor) {
          inicialComentarios[key] = (item as any).comentarios_profesor as string;
        }
      });
      setNotas(inicialNotas);
      setComentarios(inicialComentarios);
    } catch (err) {
      console.error('💥 Error de conexión en panel:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleNotaChange = (key: string, value: string) => {
    setNotas((prev) => ({ ...prev, [key]: value }));
  };

  const handleComentarioChange = (key: string, value: string) => {
    setComentarios((prev) => ({ ...prev, [key]: value }));
  };

  const guardarCalificacion = async (item: PanelCalificacionItem) => {
    const rowKey = `${item.evaluacion_id}-${item.estudiante_id}`;
    const valor = notas[rowKey] ?? '';
    if (!valor.trim()) {
      alert('Por favor ingresa una calificación');
      return;
    }

    const calificacionNum = parseFloat(valor);
    if (isNaN(calificacionNum) || calificacionNum < 0 || calificacionNum > 100) {
      alert('La calificación debe ser un número entre 0 y 100');
      return;
    }

    setGuardando(true);

    try {
      const calificacionData = {
        calificacion: calificacionNum,
        comentarios_profesor: comentarios[rowKey] ?? '',
      };

      // Usar el endpoint de panel que crea o actualiza la respuesta según sea necesario
      const response = await calificacionService.calificarDesdePanel(
        item.evaluacion_id,
        item.estudiante_id,
        calificacionData
      );

      if (response.success) {
        alert(response.message || 'Calificación guardada exitosamente');
        await cargarPanel();
      } else {
        alert(response.error || 'Error al guardar calificación');
      }
    } catch (err) {
      console.error('Error guardando calificación:', err);
      alert('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  const filtroLower = filtro.toLowerCase();
  const itemsFiltrados = items.filter((i) =>
    i.estudiante_nombre.toLowerCase().includes(filtroLower) ||
    i.evaluacion_titulo.toLowerCase().includes(filtroLower)
  );

  const itemsPorCalificar = itemsFiltrados.filter((i) => i.calificacion === null);
  const itemsCalificadas = itemsFiltrados.filter((i) => i.calificacion !== null);

  const getTipoLabel = (tipo?: string | null) => {
    if (!tipo) return '—';
    if (tipo === 'quiz') return 'Quiz';
    if (tipo === 'examen') return 'Proyectos';
    if (tipo === 'tarea') return 'Tarea';
    return tipo;
  };

  return (
    <div className="calificar-evaluaciones">
      <div className="calificar-header">
        <h2>Calificar evaluaciones</h2>
        <p>Selecciona una evaluación/tarea y asigna una nota al estudiante</p>
      </div>

      <div className="filtro-container">
        <input
          type="text"
          placeholder="Buscar por estudiante o evaluación..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="tabs-container">
        <div className="tabs-left">
          <button
            className={`tab ${activeTab === 'por-calificar' ? 'active' : ''}`}
            onClick={() => setActiveTab('por-calificar')}
          >
            📋 Por Calificar ({itemsPorCalificar.length})
          </button>
          <button
            className={`tab ${activeTab === 'calificadas' ? 'active' : ''}`}
            onClick={() => setActiveTab('calificadas')}
          >
            ✅ Calificadas ({itemsCalificadas.length})
          </button>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando respuestas...</p>
          </div>
        ) : error ? (
          <div className="error">
            <p>❌ {error}</p>
            <button onClick={cargarPanel} className="btn-retry">🔄 Reintentar</button>
          </div>
        ) : (
          <div className="respuestas-list">
            {activeTab === 'por-calificar' ? (
              itemsPorCalificar.length > 0 ? (
                <table className="tabla-calificaciones">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Evaluación</th>
                      <th>Tipo</th>
                      <th>Calificación (0-100)</th>
                      <th>Comentario</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsPorCalificar.map((item) => (
                      <tr key={`${item.evaluacion_id}-${item.estudiante_id}`}>
                        <td>{item.estudiante_nombre}</td>
                        <td>{item.evaluacion_titulo}</td>
                        <td>
                          <span className="tipo-evaluacion">{getTipoLabel(item.evaluacion_tipo)}</span>
                        </td>
                        <td>
                          <div className="celda-nota">
                            {item.archivo_respuesta_url && (
                              <a
                                href={item.archivo_respuesta_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-archivo-respuesta"
                              >
                                📎 Ver archivo del estudiante
                              </a>
                            )}
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={
                                notas[`${item.evaluacion_id}-${item.estudiante_id}`] ?? ''
                              }
                              onChange={(e) =>
                                handleNotaChange(
                                  `${item.evaluacion_id}-${item.estudiante_id}`,
                                  e.target.value
                                )
                              }
                              placeholder="Ej: 85.5"
                            />
                            {!item.tiene_respuesta && (
                              <span
                                style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}
                              >
                                (El estudiante aún no ha enviado archivo)
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <textarea
                            className="comentario-input"
                            rows={2}
                            placeholder="Comentario para el estudiante (opcional)"
                            value={
                              comentarios[`${item.evaluacion_id}-${item.estudiante_id}`] ?? ''
                            }
                            onChange={(e) =>
                              handleComentarioChange(
                                `${item.evaluacion_id}-${item.estudiante_id}`,
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            className="btn-calificar"
                            disabled={
                              guardando ||
                              !notas[`${item.evaluacion_id}-${item.estudiante_id}`]?.trim()
                            }
                            onClick={() => guardarCalificacion(item)}
                          >
                            {guardando ? '⏳ Guardando...' : '💾 Guardar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>🎉 ¡No hay evaluaciones pendientes por calificar!</p>
                </div>
              )
            ) : (
              itemsCalificadas.length > 0 ? (
                <table className="tabla-calificaciones">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Evaluación</th>
                      <th>Tipo</th>
                      <th>Calificación</th>
                      <th>Comentario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsCalificadas.map((item) => (
                      <tr key={`${item.evaluacion_id}-${item.estudiante_id}`}>
                        <td>{item.estudiante_nombre}</td>
                        <td>{item.evaluacion_titulo}</td>
                        <td>
                          <span className="tipo-evaluacion">{getTipoLabel(item.evaluacion_tipo)}</span>
                        </td>
                        <td>
                          <div className="celda-nota">
                            {item.archivo_respuesta_url && (
                              <a
                                href={item.archivo_respuesta_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-archivo-respuesta"
                              >
                                📎 Ver archivo del estudiante
                              </a>
                            )}
                            <div>
                              {item.calificacion !== null
                                ? calificacionService.formatearCalificacion(item.calificacion)
                                : '—'}
                            </div>
                          </div>
                        </td>
                        <td>
                          {item.comentarios_profesor && item.comentarios_profesor.trim() !== '' ? (
                            <span>{item.comentarios_profesor}</span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Sin comentario</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>📝 Aún no has calificado ninguna evaluación</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
