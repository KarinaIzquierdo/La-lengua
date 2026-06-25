import { useState } from 'react';
import './ClasesView.css';

interface Clase {
  id: string;
  fecha: string;
  hora: string;
  estudiantes: string[];
  tema: string;
  estado: 'programada' | 'en-curso' | 'completada' | 'cancelada';
  duracion: number;
  notas?: string;
}

export default function ClasesView() {
  const [clases] = useState<Clase[]>([
    {
      id: '1',
      fecha: '2025-09-02',
      hora: '10:00',
      estudiantes: ['Ana García', 'Carlos López', 'María Rodríguez'],
      tema: 'Conversación Básica',
      estado: 'programada',
      duracion: 60
    },
    {
      id: '2',
      fecha: '2025-09-02',
      hora: '15:30',
      estudiantes: ['Pedro Martín', 'Laura Silva'],
      tema: 'Gramática Avanzada',
      estado: 'programada',
      duracion: 90
    },
    {
      id: '3',
      fecha: '2025-09-01',
      hora: '14:00',
      estudiantes: ['José Hernández', 'Carmen Díaz', 'Roberto Torres', 'Elena Vega'],
      tema: 'Vocabulario de Negocios',
      estado: 'completada',
      duracion: 60,
      notas: 'Excelente participación. Revisar phrasal verbs la próxima clase.'
    },
    {
      id: '4',
      fecha: '2025-09-03',
      hora: '11:00',
      estudiantes: ['Andrea Morales', 'Diego Ruiz'],
      tema: 'Pronunciación',
      estado: 'programada',
      duracion: 45
    }
  ]);

  const [filtroEstado, setFiltroEstado] = useState<string>('todas');

  const clasesFiltradas = clases.filter(clase => 
    filtroEstado === 'todas' || clase.estado === filtroEstado
  );

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programada': return '#3b82f6';
      case 'en-curso': return '#10b981';
      case 'completada': return '#6b7280';
      case 'cancelada': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'programada': return 'Programada';
      case 'en-curso': return 'En Curso';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="clases-view">
      <div className="clases-header">
        <div className="header-info">
          <h2>Mis Clases Programadas</h2>
          <p>Gestiona y revisa tus clases programadas</p>
        </div>
        
        <div className="header-actions">
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-select"
          >
            <option value="todas">Todas las clases</option>
            <option value="programada">Programadas</option>
            <option value="en-curso">En curso</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      <div className="clases-grid">
        {clasesFiltradas.map((clase) => (
          <div key={clase.id} className={`clase-card ${clase.estado}`}>
            <div className="clase-header">
              <div className="clase-fecha">
                <span className="fecha-principal">{formatFecha(clase.fecha)}</span>
                <span className="hora">{clase.hora} - {clase.duracion}min</span>
              </div>
              <div 
                className="estado-badge"
                style={{ backgroundColor: getEstadoColor(clase.estado) }}
              >
                {getEstadoLabel(clase.estado)}
              </div>
            </div>

            <div className="clase-content">
              <h3 className="tema">{clase.tema}</h3>
              
              <div className="estudiantes-section">
                <span className="estudiantes-label">
                  Estudiantes ({clase.estudiantes.length}):
                </span>
                <div className="estudiantes-list">
                  {clase.estudiantes.map((estudiante, index) => (
                    <span key={index} className="estudiante-tag">
                      {estudiante}
                    </span>
                  ))}
                </div>
              </div>

              {clase.notas && (
                <div className="notas-section">
                  <span className="notas-label">Notas:</span>
                  <p className="notas-text">{clase.notas}</p>
                </div>
              )}
            </div>

            <div className="clase-actions">
              {clase.estado === 'programada' && (
                <>
                  <button className="action-btn edit">
                    ✏️ Editar
                  </button>
                  <button className="action-btn start">
                    ▶️ Iniciar Clase
                  </button>
                </>
              )}
              {clase.estado === 'completada' && (
                <button className="action-btn view">
                  👁️ Ver Detalles
                </button>
              )}
              {clase.estado === 'en-curso' && (
                <button className="action-btn finish">
                  ✅ Finalizar Clase
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {clasesFiltradas.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No hay clases</h3>
          <p>No tienes clases {filtroEstado === 'todas' ? '' : filtroEstado + 's'} en este momento.</p>
        </div>
      )}
    </div>
  );
}
