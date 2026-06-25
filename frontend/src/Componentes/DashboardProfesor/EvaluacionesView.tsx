import { useState } from 'react';
import './EvaluacionesView.css';

interface Evaluacion {
  id: string;
  titulo: string;
  tipo: 'quiz' | 'examen' | 'tarea';
  fechaCreacion: string;
  fechaLimite?: string;
  estudiantes: string[];
  preguntas: number;
  estado: 'borrador' | 'publicada' | 'cerrada';
  completadas: number;
  puntuacionPromedio?: number;
}

export default function EvaluacionesView() {
  const [evaluaciones] = useState<Evaluacion[]>([
    {
      id: '1',
      titulo: 'Quiz de Vocabulario - Unidad 3',
      tipo: 'quiz',
      fechaCreacion: '2025-08-28',
      fechaLimite: '2025-09-05',
      estudiantes: ['Ana García', 'Carlos López', 'María Rodríguez'],
      preguntas: 10,
      estado: 'publicada',
      completadas: 2,
      puntuacionPromedio: 85
    },
    {
      id: '2',
      titulo: 'Examen de Gramática Intermedia',
      tipo: 'examen',
      fechaCreacion: '2025-08-25',
      fechaLimite: '2025-09-10',
      estudiantes: ['Pedro Martín', 'Laura Silva', 'José Hernández', 'Carmen Díaz'],
      preguntas: 25,
      estado: 'publicada',
      completadas: 1,
      puntuacionPromedio: 78
    },
    {
      id: '3',
      titulo: 'Evaluación de Pronunciación',
      tipo: 'tarea',
      fechaCreacion: '2025-09-01',
      estudiantes: ['Roberto Torres', 'Elena Vega'],
      preguntas: 5,
      estado: 'borrador',
      completadas: 0
    },
    {
      id: '4',
      titulo: 'Quiz Rápido - Present Perfect',
      tipo: 'quiz',
      fechaCreacion: '2025-08-20',
      fechaLimite: '2025-08-30',
      estudiantes: ['Ana García', 'Pedro Martín', 'Carmen Díaz'],
      preguntas: 8,
      estado: 'cerrada',
      completadas: 3,
      puntuacionPromedio: 92
    }
  ]);

  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const evaluacionesFiltradas = evaluaciones.filter(evaluacion => {
    const cumpleFiltroEstado = filtroEstado === 'todas' || evaluacion.estado === filtroEstado;
    const cumpleFiltroTipo = filtroTipo === 'todos' || evaluacion.tipo === filtroTipo;
    return cumpleFiltroEstado && cumpleFiltroTipo;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return '#6b7280';
      case 'publicada': return '#10b981';
      case 'cerrada': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'Borrador';
      case 'publicada': return 'Publicada';
      case 'cerrada': return 'Cerrada';
      default: return estado;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'quiz': return '❓';
      case 'examen': return '📝';
      case 'tarea': return '📋';
      default: return '📄';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'quiz': return 'Quiz';
      case 'examen': return 'Proyectos';
      case 'tarea': return 'Tarea';
      default: return tipo;
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calcularProgreso = (completadas: number, total: number) => {
    return total > 0 ? Math.round((completadas / total) * 100) : 0;
  };

  return (
    <div className="evaluaciones-view">
      <div className="evaluaciones-header">
        <div className="header-info">
          <h2>Mis Evaluaciones</h2>
          <p>Gestiona tus quizzes, proyectos y tareas</p>
        </div>
        
        <div className="header-filters">
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los tipos</option>
            <option value="quiz">Quiz</option>
            <option value="examen">Proyectos</option>
            <option value="tarea">Tarea</option>
          </select>
          
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-select"
          >
            <option value="todas">Todos los estados</option>
            <option value="borrador">Borradores</option>
            <option value="publicada">Publicadas</option>
            <option value="cerrada">Cerradas</option>
          </select>
        </div>
      </div>

      <div className="evaluaciones-grid">
        {evaluacionesFiltradas.map((evaluacion) => (
          <div key={evaluacion.id} className={`evaluacion-card ${evaluacion.estado}`}>
            <div className="evaluacion-header">
              <div className="tipo-info">
                <span className="tipo-icon">{getTipoIcon(evaluacion.tipo)}</span>
                <span className="tipo-label">{getTipoLabel(evaluacion.tipo)}</span>
              </div>
              <div 
                className="estado-badge"
                style={{ backgroundColor: getEstadoColor(evaluacion.estado) }}
              >
                {getEstadoLabel(evaluacion.estado)}
              </div>
            </div>

            <div className="evaluacion-content">
              <h3 className="titulo">{evaluacion.titulo}</h3>
              
              <div className="evaluacion-stats">
                <div className="stat-item">
                  <span className="stat-icon">❓</span>
                  <span className="stat-text">{evaluacion.preguntas} preguntas</span>
                </div>
                
                <div className="stat-item">
                  <span className="stat-icon">👥</span>
                  <span className="stat-text">{evaluacion.estudiantes.length} estudiantes</span>
                </div>
                
                <div className="stat-item">
                  <span className="stat-icon">📅</span>
                  <span className="stat-text">Creada: {formatFecha(evaluacion.fechaCreacion)}</span>
                </div>
                
                {evaluacion.fechaLimite && (
                  <div className="stat-item">
                    <span className="stat-icon">⏰</span>
                    <span className="stat-text">Límite: {formatFecha(evaluacion.fechaLimite)}</span>
                  </div>
                )}
              </div>

              {evaluacion.estado === 'publicada' && (
                <div className="progreso-section">
                  <div className="progreso-header">
                    <span>Progreso de completado</span>
                    <span>{evaluacion.completadas}/{evaluacion.estudiantes.length}</span>
                  </div>
                  <div className="progreso-bar">
                    <div 
                      className="progreso-fill"
                      style={{ 
                        width: `${calcularProgreso(evaluacion.completadas, evaluacion.estudiantes.length)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {evaluacion.puntuacionPromedio && (
                <div className="puntuacion-promedio">
                  <span className="promedio-label">Puntuación promedio:</span>
                  <span className="promedio-valor">{evaluacion.puntuacionPromedio}%</span>
                </div>
              )}
            </div>

            <div className="evaluacion-actions">
              {evaluacion.estado === 'borrador' && (
                <>
                  <button className="action-btn edit">
                    ✏️ Editar
                  </button>
                  <button className="action-btn publish">
                    📤 Publicar
                  </button>
                </>
              )}
              
              {evaluacion.estado === 'publicada' && (
                <>
                  <button className="action-btn view-results">
                    📊 Ver Resultados
                  </button>
                  <button className="action-btn close">
                    🔒 Cerrar
                  </button>
                </>
              )}
              
              {evaluacion.estado === 'cerrada' && (
                <button className="action-btn view-results">
                  📊 Ver Resultados Finales
                </button>
              )}
              
              <button className="action-btn duplicate">
                📋 Duplicar
              </button>
            </div>
          </div>
        ))}
      </div>

      {evaluacionesFiltradas.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No hay evaluaciones</h3>
          <p>No tienes evaluaciones que coincidan con los filtros seleccionados.</p>
        </div>
      )}
    </div>
  );
}
