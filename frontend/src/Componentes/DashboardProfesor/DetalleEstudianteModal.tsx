import { useState } from 'react';
import './DetalleEstudianteModal.css';

interface EstudianteProgreso {
  id: number;
  nombre: string;
  nivel: string;
  progreso: number;
  clasesCompletadas: number;
  clasesTotales: number;
  ultimaClase: string;
  fortalezas: string[];
  areasAMejorar: string[];
  calificacionPromedio: number;
}

interface DetalleEstudianteModalProps {
  estudiante: EstudianteProgreso;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetalleEstudianteModal({ estudiante, isOpen, onClose }: DetalleEstudianteModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'notas' | 'asistencia' | 'retos'>('general');

  if (!isOpen) return null;

  // Datos simulados adicionales para el modal
  const datosAdicionales = {
    email: `${estudiante.nombre.toLowerCase().replace(' ', '.')}@email.com`,
    telefono: '+57 300 123 4567',
    fechaInicio: '2024-09-01',
    horasEstudio: 45,
    rachaActual: 12,
    mejorRacha: 18,
    retosCompletados: 28,
    retosTotales: 35,
    asistencia: 92,
    puntualidad: 88,
    participacion: 85,
    tareas: 90,
    examenes: [
      { fecha: '2024-12-01', tipo: 'Vocabulario', nota: 8.5 },
      { fecha: '2024-11-15', tipo: 'Gramática', nota: 7.8 },
      { fecha: '2024-11-01', tipo: 'Comprensión', nota: 9.2 },
      { fecha: '2024-10-15', tipo: 'Conversación', nota: 8.0 }
    ],
    asistenciaDetalle: [
      { fecha: '2024-12-10', estado: 'Presente', puntualidad: 'A tiempo' },
      { fecha: '2024-12-08', estado: 'Presente', puntualidad: '5 min tarde' },
      { fecha: '2024-12-06', estado: 'Presente', puntualidad: 'A tiempo' },
      { fecha: '2024-12-04', estado: 'Ausente', puntualidad: '-' },
      { fecha: '2024-12-02', estado: 'Presente', puntualidad: 'A tiempo' }
    ]
  };

  const generarReporte = () => {
    const reporteTexto = `
REPORTE DETALLADO - ${estudiante.nombre}
===============================================

INFORMACIÓN PERSONAL:
- Email: ${datosAdicionales.email}
- Teléfono: ${datosAdicionales.telefono}
- Fecha de inicio: ${new Date(datosAdicionales.fechaInicio).toLocaleDateString('es-ES')}

PROGRESO ACADÉMICO:
- Nivel: ${estudiante.nivel}
- Progreso general: ${estudiante.progreso}%
- Clases completadas: ${estudiante.clasesCompletadas} de ${estudiante.clasesTotales}
- Calificación promedio: ${estudiante.calificacionPromedio}/10
- Horas de estudio: ${datosAdicionales.horasEstudio}h

RENDIMIENTO:
- Asistencia: ${datosAdicionales.asistencia}%
- Puntualidad: ${datosAdicionales.puntualidad}%
- Participación: ${datosAdicionales.participacion}%
- Tareas: ${datosAdicionales.tareas}%

GAMIFICACIÓN:
- Racha actual: ${datosAdicionales.rachaActual} días
- Mejor racha: ${datosAdicionales.mejorRacha} días
- Retos completados: ${datosAdicionales.retosCompletados}/${datosAdicionales.retosTotales}

FORTALEZAS:
${estudiante.fortalezas.map(f => `- ${f}`).join('\n')}

ÁREAS A MEJORAR:
${estudiante.areasAMejorar.map(a => `- ${a}`).join('\n')}

ÚLTIMOS EXÁMENES:
${datosAdicionales.examenes.map(e => `- ${e.fecha}: ${e.tipo} - ${e.nota}/10`).join('\n')}

RECOMENDACIONES:
- Continuar reforzando las fortalezas identificadas
- Enfocar las próximas clases en las áreas de mejora
- Mantener la motivación y el ritmo de aprendizaje
- Trabajar en mejorar la puntualidad

Generado el: ${new Date().toLocaleDateString('es-ES')}
    `.trim();

    const blob = new Blob([reporteTexto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Detallado_${estudiante.nombre.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detalle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="estudiante-info-header">
            <div className="avatar-section">
              <div className="avatar-circle">
                {estudiante.nombre.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="info-basica">
                <h2>{estudiante.nombre}</h2>
                <span className={`nivel-badge ${estudiante.nivel.toLowerCase()}`}>
                  {estudiante.nivel}
                </span>
                <p className="email">{datosAdicionales.email}</p>
              </div>
            </div>
            <div className="stats-rapidas">
              <div className="stat-item">
                <span className="stat-numero">{estudiante.progreso}%</span>
                <span className="stat-label">Progreso</span>
              </div>
              <div className="stat-item">
                <span className="stat-numero">{estudiante.calificacionPromedio}</span>
                <span className="stat-label">Promedio</span>
              </div>
              <div className="stat-item">
                <span className="stat-numero">{datosAdicionales.asistencia}%</span>
                <span className="stat-label">Asistencia</span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            📊 General
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notas' ? 'active' : ''}`}
            onClick={() => setActiveTab('notas')}
          >
            📝 Notas
          </button>
          <button 
            className={`tab-btn ${activeTab === 'asistencia' ? 'active' : ''}`}
            onClick={() => setActiveTab('asistencia')}
          >
            📅 Asistencia
          </button>
          <button 
            className={`tab-btn ${activeTab === 'retos' ? 'active' : ''}`}
            onClick={() => setActiveTab('retos')}
          >
            🎯 Retos
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'general' && (
            <div className="tab-content">
              <div className="content-grid">
                <div className="info-section">
                  <h3>📈 Progreso Académico</h3>
                  <div className="progreso-detallado">
                    <div className="progreso-barra-modal">
                      <div className="progreso-info">
                        <span>Progreso General</span>
                        <span>{estudiante.progreso}%</span>
                      </div>
                      <div className="barra-fondo">
                        <div 
                          className="barra-relleno"
                          style={{ width: `${estudiante.progreso}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="clases-info">
                      <div className="clases-completadas">
                        <span className="numero">{estudiante.clasesCompletadas}</span>
                        <span className="label">Clases Completadas</span>
                      </div>
                      <div className="clases-restantes">
                        <span className="numero">{estudiante.clasesTotales - estudiante.clasesCompletadas}</span>
                        <span className="label">Clases Restantes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>⭐ Rendimiento</h3>
                  <div className="rendimiento-grid">
                    <div className="rendimiento-item">
                      <div className="rendimiento-circular">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path
                            className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="circle"
                            strokeDasharray={`${datosAdicionales.asistencia}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <text x="18" y="20.35" className="percentage">{datosAdicionales.asistencia}%</text>
                        </svg>
                      </div>
                      <span className="rendimiento-label">Asistencia</span>
                    </div>
                    <div className="rendimiento-item">
                      <div className="rendimiento-circular">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path
                            className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="circle"
                            strokeDasharray={`${datosAdicionales.participacion}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <text x="18" y="20.35" className="percentage">{datosAdicionales.participacion}%</text>
                        </svg>
                      </div>
                      <span className="rendimiento-label">Participación</span>
                    </div>
                    <div className="rendimiento-item">
                      <div className="rendimiento-circular">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path
                            className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="circle"
                            strokeDasharray={`${datosAdicionales.tareas}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <text x="18" y="20.35" className="percentage">{datosAdicionales.tareas}%</text>
                        </svg>
                      </div>
                      <span className="rendimiento-label">Tareas</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>💪 Fortalezas</h3>
                  <div className="tags-container">
                    {estudiante.fortalezas.map((fortaleza, index) => (
                      <span key={index} className="tag fortaleza">{fortaleza}</span>
                    ))}
                  </div>
                </div>

                <div className="info-section">
                  <h3>🎯 Áreas a Mejorar</h3>
                  <div className="tags-container">
                    {estudiante.areasAMejorar.map((area, index) => (
                      <span key={index} className="tag area-mejorar">{area}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notas' && (
            <div className="tab-content">
              <div className="notas-section">
                <h3>📊 Historial de Exámenes</h3>
                <div className="examenes-tabla">
                  <div className="tabla-header">
                    <span>Fecha</span>
                    <span>Tipo</span>
                    <span>Nota</span>
                    <span>Estado</span>
                  </div>
                  {datosAdicionales.examenes.map((examen, index) => (
                    <div key={index} className="tabla-fila">
                      <span>{new Date(examen.fecha).toLocaleDateString('es-ES')}</span>
                      <span>{examen.tipo}</span>
                      <span className="nota">{examen.nota}/10</span>
                      <span className={`estado ${examen.nota >= 8 ? 'excelente' : examen.nota >= 7 ? 'bueno' : 'regular'}`}>
                        {examen.nota >= 8 ? 'Excelente' : examen.nota >= 7 ? 'Bueno' : 'Regular'}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="notas-profesor-section">
                  <h3>📝 Notas del Profesor</h3>
                  <div className="nota-item">
                    <div className="nota-fecha">10 Dic 2024</div>
                    <div className="nota-contenido">
                      Estudiante muy dedicado y puntual. Muestra gran interés en aprender y 
                      participa activamente en las clases. Recomiendo continuar con ejercicios 
                      de conversación para ganar más confianza.
                    </div>
                  </div>
                  <div className="nota-item">
                    <div className="nota-fecha">25 Nov 2024</div>
                    <div className="nota-contenido">
                      Excelente progreso en vocabulario. Necesita trabajar más en la pronunciación 
                      de algunos sonidos específicos del inglés.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'asistencia' && (
            <div className="tab-content">
              <div className="asistencia-section">
                <div className="asistencia-stats">
                  <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                      <span className="stat-numero">{datosAdicionales.asistencia}%</span>
                      <span className="stat-label">Asistencia General</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-info">
                      <span className="stat-numero">{datosAdicionales.puntualidad}%</span>
                      <span className="stat-label">Puntualidad</span>
                    </div>
                  </div>
                </div>

                <h3>📋 Historial de Asistencia</h3>
                <div className="asistencia-tabla">
                  <div className="tabla-header">
                    <span>Fecha</span>
                    <span>Estado</span>
                    <span>Puntualidad</span>
                  </div>
                  {datosAdicionales.asistenciaDetalle.map((registro, index) => (
                    <div key={index} className="tabla-fila">
                      <span>{new Date(registro.fecha).toLocaleDateString('es-ES')}</span>
                      <span className={`estado ${registro.estado.toLowerCase()}`}>
                        {registro.estado}
                      </span>
                      <span className="puntualidad">{registro.puntualidad}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'retos' && (
            <div className="tab-content">
              <div className="retos-section">
                <div className="retos-stats">
                  <div className="stat-card">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-info">
                      <span className="stat-numero">{datosAdicionales.rachaActual}</span>
                      <span className="stat-label">Racha Actual</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-info">
                      <span className="stat-numero">{datosAdicionales.mejorRacha}</span>
                      <span className="stat-label">Mejor Racha</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-info">
                      <span className="stat-numero">{datosAdicionales.retosCompletados}/{datosAdicionales.retosTotales}</span>
                      <span className="stat-label">Retos Completados</span>
                    </div>
                  </div>
                </div>

                <div className="progreso-retos">
                  <h3>📈 Progreso en Retos</h3>
                  <div className="reto-progreso">
                    <div className="reto-info">
                      <span>Retos Completados</span>
                      <span>{Math.round((datosAdicionales.retosCompletados / datosAdicionales.retosTotales) * 100)}%</span>
                    </div>
                    <div className="barra-fondo">
                      <div 
                        className="barra-relleno"
                        style={{ width: `${(datosAdicionales.retosCompletados / datosAdicionales.retosTotales) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="logros-section">
                  <h3>🏅 Logros Recientes</h3>
                  <div className="logros-lista">
                    <div className="logro-item">
                      <div className="logro-icon">🔥</div>
                      <div className="logro-info">
                        <span className="logro-titulo">Racha de 7 días</span>
                        <span className="logro-fecha">Hace 2 días</span>
                      </div>
                    </div>
                    <div className="logro-item">
                      <div className="logro-icon">📚</div>
                      <div className="logro-info">
                        <span className="logro-titulo">25 retos completados</span>
                        <span className="logro-fecha">Hace 1 semana</span>
                      </div>
                    </div>
                    <div className="logro-item">
                      <div className="logro-icon">⭐</div>
                      <div className="logro-info">
                        <span className="logro-titulo">Calificación perfecta</span>
                        <span className="logro-fecha">Hace 2 semanas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-generar-reporte" onClick={generarReporte}>
            📄 Generar Reporte Completo
          </button>
          <button className="btn-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
