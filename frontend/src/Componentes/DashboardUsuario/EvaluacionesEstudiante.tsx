import React, { useState, useEffect } from 'react';
import { evaluacionService } from '../../services/evaluacionService';
import QuizTaker from './QuizTaker';
import './EvaluacionesEstudiante.css';

interface EvaluacionEstudiante {
  id: string;
  titulo: string;
  nivel: string;
  unidad: string;
  clase: string;
  enlace: string;
  descripcion?: string;
  tipo: 'quiz' | 'examen' | 'tarea';
  fecha_limite?: string;
  created_at: string;
  profesor_nombre?: string;
  archivo_url?: string;
  activa: boolean;
}

export default function EvaluacionesEstudiante() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionEstudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subiendoRespuesta, setSubiendoRespuesta] = useState<string | null>(null);
  const [evaluacionesConRespuesta, setEvaluacionesConRespuesta] = useState<string[]>([]);

  useEffect(() => {
    loadEvaluaciones();
    loadRespuestas();
  }, []);

  const loadEvaluaciones = async () => {
    try {
      setLoading(true);
      // Obtener evaluaciones reales del backend
      const response = await evaluacionService.getStudentEvaluaciones();
      
      if (response.success && Array.isArray(response.data)) {
        // Mapear las evaluaciones del backend al formato del frontend
        const evaluacionesMapeadas = response.data.map((evalBackend: any) => {
          const descripcion = evalBackend.descripcion || '';
          
          // Parsear la descripción para extraer nivel, unidad, clase y enlace
          const parseDescripcion = (desc: string) => {
            const nivel = desc.match(/Nivel: ([^|]+)/)?.[1]?.trim() || 'A1';
            const unidad = desc.match(/Unidad: ([^|]+)/)?.[1]?.trim() || 'Unit 1';
            const clase = desc.match(/Clase: ([^|]+)/)?.[1]?.trim() || 'Class 1';
            const enlace = desc.match(/Enlace: (.+)/)?.[1]?.trim() || '';
            return { nivel, unidad, clase, enlace };
          };
          
          const { nivel, unidad, clase, enlace } = parseDescripcion(descripcion);
          
          return {
            id: evalBackend.id.toString(),
            titulo: evalBackend.titulo,
            nivel,
            unidad,
            clase,
            enlace,
            tipo: evalBackend.tipo || 'quiz',
            fecha_limite: evalBackend.fecha_limite || undefined,
            created_at: evalBackend.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            profesor_nombre: evalBackend.profesor_nombre || 'Profesor',
            archivo_url: evalBackend.archivo || undefined,
            activa: evalBackend.estado === 'publicada'
          };
        });
        
        setEvaluaciones(evaluacionesMapeadas);
      } else {
        console.warn('No se pudieron cargar las evaluaciones:', response);
        setEvaluaciones([]);
      }
    } catch (err) {
      setError('Error al cargar evaluaciones');
      console.error('Error loading student evaluaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRespuestas = async () => {
    try {
      const respuestasResp = await evaluacionService.getStudentRespuestas();

      let respuestasList: any[] = [];
      if (Array.isArray(respuestasResp)) {
        respuestasList = respuestasResp;
      } else if (respuestasResp && Array.isArray(respuestasResp.data)) {
        respuestasList = respuestasResp.data;
      }

      const ids = respuestasList
        .filter((resp: any) => resp.evaluacion)
        .map((resp: any) => String(resp.evaluacion));

      const uniqueIds = Array.from(new Set(ids));
      setEvaluacionesConRespuesta(uniqueIds);
    } catch (err) {
      console.error('Error cargando respuestas del estudiante:', err);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const badges = {
      'quiz': { class: 'badge-quiz', text: 'Quiz', icon: '📝' },
      'examen': { class: 'badge-exam', text: 'Proyectos', icon: '📋' },
      'tarea': { class: 'badge-task', text: 'Tarea', icon: '📚' }
    };
    return badges[tipo as keyof typeof badges] || badges.quiz;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const descargarEvaluacion = async (evaluacion: EvaluacionEstudiante) => {
    try {
      const response = await evaluacionService.downloadEvaluacion(evaluacion.id);
      if (response.success) {
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.filename || `${evaluacion.titulo}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al descargar: ' + response.message);
      }
    } catch (error) {
      console.error('Error al descargar evaluación:', error);
      alert('Error al descargar evaluación');
    }
  };

  const subirRespuesta = async (evaluacion: EvaluacionEstudiante) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.odt,.ods,.odp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setSubiendoRespuesta(evaluacion.id);
          const response = await evaluacionService.uploadRespuesta(evaluacion.id, {
            archivo_respuesta: file,
            comentarios: ''
          });
          if (response.success) {
            alert('Respuesta subida exitosamente');
            loadEvaluaciones(); // Recargar evaluaciones
            loadRespuestas();   // Actualizar estado de tareas enviadas
          } else {
            alert('Error al subir respuesta: ' + response.message);
          }
        } catch (error) {
          console.error('Error al subir respuesta:', error);
          alert('Error al subir respuesta');
        } finally {
          setSubiendoRespuesta(null);
        }
      }
    };
    input.click();
  };

  const isOverdue = (fechaLimite?: string) => {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < new Date();
  };

  const respuestasSet = new Set(evaluacionesConRespuesta);

  return (
    <div className="evaluaciones-section">
      <h2 className="section-title">📋 Mis Evaluaciones</h2>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando evaluaciones...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar evaluaciones</h3>
          <p>{error}</p>
          <button onClick={loadEvaluaciones} className="retry-btn">
            🔄 Reintentar
          </button>
        </div>
      )}

      {!loading && !error && evaluaciones.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No tienes evaluaciones asignadas</h3>
          <p>Cuando tus profesores publiquen evaluaciones, aparecerán aquí</p>
        </div>
      )}

      {!loading && !error && evaluaciones.length > 0 && (
        <div className="evaluaciones-tabla">
          <table className="tabla-evaluaciones">
            <thead>
              <tr>
                <th>Evaluación</th>
                <th>Tipo</th>
                <th>Profesor</th>
                <th>Fecha Límite</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.map((evaluacion) => {
                const overdue = isOverdue(evaluacion.fecha_limite);
                const hasRespuesta = respuestasSet.has(evaluacion.id);
                
                return (
                  <React.Fragment key={evaluacion.id}>
                    <tr className={overdue ? 'evaluacion-vencida' : ''}>
                      <td>{evaluacion.titulo}</td>
                      <td>
                        <span className={`tipo-badge tipo-${evaluacion.tipo}`}>
                          {evaluacion.tipo === 'quiz' && '🎯 Quiz'}
                          {evaluacion.tipo === 'examen' && '📋 Proyectos'}
                          {evaluacion.tipo === 'tarea' && '📚 Tarea'}
                        </span>
                      </td>
                      <td>{evaluacion.profesor_nombre || 'Sin profesor'}</td>
                      <td>
                        {evaluacion.fecha_limite ? (
                          <span className={overdue ? 'fecha-vencida' : 'fecha-limite'}>
                            {new Date(evaluacion.fecha_limite).toLocaleDateString()}
                          </span>
                        ) : (
                          'Sin fecha límite'
                        )}
                      </td>
                      <td>
                        {evaluacion.tipo === 'tarea' ? (
                          <div className="acciones-tarea">
                            {evaluacion.archivo_url ? (
                              <button
                                className="btn-acceder-evaluacion"
                                onClick={() => descargarEvaluacion(evaluacion)}
                                disabled={overdue}
                              >
                                📥 Descargar Tarea
                              </button>
                            ) : evaluacion.enlace ? (
                              <button
                                className="btn-acceder-evaluacion"
                                onClick={() => window.open(evaluacion.enlace, '_blank')}
                                disabled={overdue}
                              >
                                🔗 Abrir Tarea
                              </button>
                            ) : null}
                            <button
                              className={`btn-subir-tarea ${hasRespuesta ? 'btn-tarea-enviada' : ''}`}
                              onClick={() => subirRespuesta(evaluacion)}
                              disabled={subiendoRespuesta === evaluacion.id || overdue}
                            >
                              {subiendoRespuesta === evaluacion.id
                                ? '⏳ Subiendo...'
                                : hasRespuesta
                                  ? '✅ Tarea enviada'
                                  : '📤 Subir Tarea'}
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn-acceder-evaluacion"
                            onClick={() => window.open(evaluacion.enlace, '_blank')}
                            disabled={!evaluacion.activa || overdue}
                          >
                            🚀 Realizar Evaluación
                          </button>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
