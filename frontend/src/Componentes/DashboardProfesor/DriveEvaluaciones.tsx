import React, { useState, useEffect } from 'react';
import './DriveEvaluaciones.css';
import { evaluacionProfesorService, type Estudiante } from '../../services/evaluacionProfesorService';

interface Evaluacion {
  id: number;
  titulo: string;
  nivel: string;
  unidad: string;
  clase: string;
  enlace: string;
  fecha_creacion: string;
  activa: boolean;
  tipo?: string;
  estudiantes_asignados?: number[];
}

export default function DriveEvaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'assign'>('list');
  const [editingEvaluacion, setEditingEvaluacion] = useState<Evaluacion | null>(null);
  const [assigningEvaluacion, setAssigningEvaluacion] = useState<Evaluacion | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [enlaceError, setEnlaceError] = useState('');
  const [formData, setFormData] = useState({
    titulo: '',
    nivel: '',
    unidad: '',
    clase: '',
    enlace: '',
    tipo: 'quiz',
    archivo: null as File | null,
  });

  // Lista de estudiantes (cargada desde el backend)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Cargar evaluaciones existentes
  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  const cargarEvaluaciones = async () => {
    try {
      const evaluacionesData = await evaluacionProfesorService.getEvaluaciones();
      // Asegurarse de que sea un array
      if (Array.isArray(evaluacionesData)) {
        // Parsear cada evaluación del backend
        const evaluacionesParsed = evaluacionesData.map((evalBackend: any) => {
          const descripcion = evalBackend.descripcion || '';
          
          const parseDescripcion = (desc: string) => {
            const nivel = desc.match(/Nivel: ([^|]+)/)?.[1]?.trim() || 'A1';
            const unidad = desc.match(/Unidad: ([^|]+)/)?.[1]?.trim() || 'Unit 1';
            const clase = desc.match(/Clase: ([^|]+)/)?.[1]?.trim() || 'Class 1';
            const enlace = desc.match(/Enlace: (.+)/)?.[1]?.trim() || '';
            return { nivel, unidad, clase, enlace };
          };
          
          const { nivel, unidad, clase, enlace } = parseDescripcion(descripcion);
          
          return {
            id: evalBackend.id,
            titulo: evalBackend.titulo,
            nivel,
            unidad,
            clase,
            enlace,
            fecha_creacion: evalBackend.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            activa: evalBackend.estado === 'publicada',
            tipo: evalBackend.tipo || 'quiz',
            estudiantes_asignados: evalBackend.estudiantes_asignados || []
          };
        });
        
        setEvaluaciones(evaluacionesParsed);
      } else {
        console.warn('getEvaluaciones no devolvió un array:', evaluacionesData);
        setEvaluaciones([]);
      }
    } catch (error) {
      console.error('Error cargando evaluaciones:', error);
      setEvaluaciones([]);
    }
  };

  const cargarEstudiantes = async () => {
    try {
      setLoadingStudents(true);
      const estudiantesData = await evaluacionProfesorService.getEstudiantes();
      setEstudiantes(estudiantesData);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
      setEstudiantes([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar que haya al menos un enlace o un archivo adjunto
      if (!formData.enlace && !formData.archivo) {
        alert('Debes ingresar un enlace de evaluación o adjuntar un archivo (PDF, Word, etc.).');
        return;
      }

      // Validar que el enlace sea una URL válida si se proporcionó
      if (formData.enlace) {
        const esUrlValida = /^https?:\/\/.+/i.test(formData.enlace.trim());
        if (!esUrlValida) {
          alert('El enlace debe ser una URL válida que empiece con http:// o https://\n\nEjemplo: https://forms.gle/... o https://docs.google.com/...');
          return;
        }
      }

      if (editingEvaluacion) {
        // Actualizar evaluación existente en el backend
        const result = await evaluacionProfesorService.actualizarEvaluacion(editingEvaluacion.id, formData);
        
        if (result.success) {
          // Actualizar en el estado local
          setEvaluaciones(prev => 
            prev.map(ev => ev.id === editingEvaluacion.id ? { ...ev, ...formData } : ev)
          );
          alert('Evaluación actualizada correctamente');
        } else {
          alert(result.message || 'Error al actualizar evaluación');
          return;
        }
      } else {
        // Crear nueva evaluación en el backend
        const result = await evaluacionProfesorService.crearEvaluacion(formData);
        
        if (result.success && result.data) {
          // Parsear la descripción para extraer nivel, unidad, clase, enlace
          const descripcion = result.data.descripcion || '';
          const parseDescripcion = (desc: string) => {
            const nivel = desc.match(/Nivel: ([^|]+)/)?.[1]?.trim() || formData.nivel;
            const unidad = desc.match(/Unidad: ([^|]+)/)?.[1]?.trim() || formData.unidad;
            const clase = desc.match(/Clase: ([^|]+)/)?.[1]?.trim() || formData.clase;
            const enlace = desc.match(/Enlace: (.+)/)?.[1]?.trim() || formData.enlace;
            return { nivel, unidad, clase, enlace };
          };
          
          const { nivel, unidad, clase, enlace } = parseDescripcion(descripcion);
          
          // Agregar al estado local con los datos del backend
          const nuevaEvaluacion: Evaluacion = {
            id: result.data.id,
            titulo: result.data.titulo,
            nivel,
            unidad,
            clase,
            enlace,
            fecha_creacion: result.data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            activa: result.data.estado === 'publicada'
          };
          
          setEvaluaciones(prev => [...prev, nuevaEvaluacion]);
          alert('Evaluación creada correctamente');
        } else {
          alert(result.message || 'Error al crear evaluación');
          return;
        }
      }
      
      // Resetear formulario solo si todo salió bien
      setFormData({ titulo: '', nivel: '', unidad: '', clase: '', enlace: '', tipo: 'quiz', archivo: null });
      setEnlaceError('');
      setShowModal(false);
      setEditingEvaluacion(null);
      
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      alert('Error al guardar la evaluación');
    }
  };

  const handleEdit = (evaluacion: Evaluacion) => {
    setEditingEvaluacion(evaluacion);
    setEnlaceError('');
    setFormData({
      titulo: evaluacion.titulo,
      nivel: evaluacion.nivel,
      unidad: evaluacion.unidad,
      clase: evaluacion.clase,
      enlace: evaluacion.enlace,
      tipo: evaluacion.tipo || 'quiz',
      archivo: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta evaluación?')) {
      try {
        const result = await evaluacionProfesorService.eliminarEvaluacion(id);
        
        if (result.success) {
          setEvaluaciones(prev => prev.filter(ev => ev.id !== id));
          alert(result.message || 'Evaluación eliminada correctamente');
        } else {
          alert(result.message || 'Error al eliminar evaluación');
        }
      } catch (error) {
        console.error('Error eliminando evaluación:', error);
        alert('Error al eliminar evaluación');
      }
    }
  };

  const toggleActiva = async (id: number) => {
    try {
      const result = await evaluacionProfesorService.toggleActiva(id);
      
      if (result.success) {
        setEvaluaciones(prev => 
          prev.map(ev => 
            ev.id === id ? { ...ev, activa: !ev.activa } : ev
          )
        );
        alert(result.message || 'Estado actualizado correctamente');
      } else {
        alert(result.message || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar estado');
    }
  };

  const openModal = () => {
    setFormData({ titulo: '', nivel: '', unidad: '', clase: '', enlace: '', tipo: 'quiz', archivo: null });
    setEditingEvaluacion(null);
    setShowModal(true);
  };

  const openAssignView = (evaluacion: Evaluacion) => {
    setAssigningEvaluacion(evaluacion);
    setSelectedStudents([]);
    setCurrentView('assign');
    // Cargar estudiantes cuando se abre la vista de asignación
    cargarEstudiantes();
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Seleccionar todos los estudiantes del mismo nivel
  const selectAllSameLevel = () => {
    if (!assigningEvaluacion) return;
    const sameLevelIds = getStudentsByLevel(assigningEvaluacion.nivel).map(e => e.id);
    setSelectedStudents(prev => {
      const otherStudents = prev.filter(id => !sameLevelIds.includes(id));
      const allSameSelected = sameLevelIds.every(id => prev.includes(id));
      return allSameSelected ? otherStudents : [...otherStudents, ...sameLevelIds];
    });
  };

  // Seleccionar todos los estudiantes de otros niveles
  const selectAllOtherLevels = () => {
    if (!assigningEvaluacion) return;
    const otherLevelIds = estudiantes.filter(e => e.nivel !== assigningEvaluacion.nivel).map(e => e.id);
    setSelectedStudents(prev => {
      const sameLevelStudents = prev.filter(id => !otherLevelIds.includes(id));
      const allOtherSelected = otherLevelIds.every(id => prev.includes(id));
      return allOtherSelected ? sameLevelStudents : [...sameLevelStudents, ...otherLevelIds];
    });
  };

  // Seleccionar TODOS los estudiantes
  const selectAllStudents = () => {
    const allIds = estudiantes.map(e => e.id);
    setSelectedStudents(prev => {
      const allSelected = allIds.every(id => prev.includes(id));
      return allSelected ? [] : allIds;
    });
  };

  const handleAssignEvaluacion = async () => {
    if (!assigningEvaluacion || selectedStudents.length === 0) {
      alert('Selecciona al menos un estudiante');
      return;
    }

    try {
      const result = await evaluacionProfesorService.asignarEvaluacion(
        assigningEvaluacion.id, 
        selectedStudents
      );
      
      if (result.success) {
        alert(result.message || `Evaluación "${assigningEvaluacion.titulo}" asignada a ${selectedStudents.length} estudiante(s)`);
        
        // Recargar evaluaciones para actualizar el contador
        await cargarEvaluaciones();
        
        setCurrentView('list');
        setAssigningEvaluacion(null);
        setSelectedStudents([]);
      } else {
        alert(result.message || 'Error al asignar evaluación');
      }
    } catch (error) {
      console.error('Error asignando evaluación:', error);
      alert('Error al asignar evaluación');
    }
  };

  const getStudentsByLevel = (nivel: string) => {
    return estudiantes.filter(estudiante => estudiante.nivel === nivel);
  };

  // Función para volver a la lista
  const backToList = () => {
    setCurrentView('list');
    setAssigningEvaluacion(null);
    setSelectedStudents([]);
  };

  // Vista de asignación
  if (currentView === 'assign' && assigningEvaluacion) {
    return (
      <div className="drive-evaluaciones-container">
        <div className="assign-header">
          <button className="btn-back" onClick={backToList}>
            ← Volver a Evaluaciones
          </button>
          <h1>Asignar Evaluación: {assigningEvaluacion.titulo}</h1>
        </div>

        <div className="assign-content-page">
          <div className="evaluacion-info-summary">
            <div className="info-row">
              <span>🎯 Nivel: <strong>{assigningEvaluacion.nivel}</strong></span>
              <span>📚 Unidad: <strong>{assigningEvaluacion.unidad}</strong></span>
              <span>📖 Clase: <strong>{assigningEvaluacion.clase}</strong></span>
            </div>
          </div>

          <div className="students-section">
            <div className="students-header">
              <h3>Seleccionar Estudiantes</h3>
              <button 
                type="button" 
                className="btn-select-all"
                onClick={selectAllStudents}
              >
                {estudiantes.length > 0 && estudiantes.every(e => selectedStudents.includes(e.id)) 
                  ? '❌ Deseleccionar todos' 
                  : '✅ Seleccionar todos'}
              </button>
            </div>
            
            {loadingStudents ? (
              <div className="loading-students">
                <div className="spinner"></div>
                <p>Cargando estudiantes...</p>
              </div>
            ) : estudiantes.length === 0 ? (
              <div className="no-students">
                <p>No se encontraron estudiantes registrados.</p>
              </div>
            ) : (
              <>
                {/* Estudiantes del mismo nivel (recomendados) */}
                {getStudentsByLevel(assigningEvaluacion.nivel).length > 0 && (
                  <div className="students-group">
                    <div className="group-header">
                      <h4>🎯 Estudiantes de nivel {assigningEvaluacion.nivel} (Recomendado)</h4>
                      <button 
                        type="button" 
                        className="btn-select-group"
                        onClick={selectAllSameLevel}
                      >
                        {getStudentsByLevel(assigningEvaluacion.nivel).every(e => selectedStudents.includes(e.id))
                          ? '❌ Deseleccionar' 
                          : '✅ Seleccionar todos'}
                      </button>
                    </div>
                    <div className="students-list">
                      {getStudentsByLevel(assigningEvaluacion.nivel).map(estudiante => (
                        <label key={estudiante.id} className="student-item recommended">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(estudiante.id)}
                            onChange={() => handleStudentToggle(estudiante.id)}
                          />
                          <div className="student-info">
                            <span className="student-name">{estudiante.nombre}</span>
                            <span className="student-email">{estudiante.email}</span>
                            <span className="student-level">{estudiante.nivel}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Otros estudiantes */}
                <div className="students-group">
                  <div className="group-header">
                    <h4>👥 Otros Estudiantes</h4>
                    <button 
                      type="button" 
                      className="btn-select-group"
                      onClick={selectAllOtherLevels}
                    >
                      {estudiantes.filter(e => e.nivel !== assigningEvaluacion.nivel).every(e => selectedStudents.includes(e.id))
                        ? '❌ Deseleccionar' 
                        : '✅ Seleccionar todos'}
                    </button>
                  </div>
                  <div className="students-list">
                    {estudiantes.filter(e => e.nivel !== assigningEvaluacion.nivel).map(estudiante => (
                      <label key={estudiante.id} className="student-item">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(estudiante.id)}
                          onChange={() => handleStudentToggle(estudiante.id)}
                        />
                        <div className="student-info">
                          <span className="student-name">{estudiante.nombre}</span>
                          <span className="student-email">{estudiante.email}</span>
                          <span className="student-level">{estudiante.nivel}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="selected-count">
                  {selectedStudents.length > 0 && (
                    <p>✅ {selectedStudents.length} estudiante(s) seleccionado(s)</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="assign-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={backToList}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn-save" 
              onClick={handleAssignEvaluacion}
              disabled={selectedStudents.length === 0}
            >
              Asignar a {selectedStudents.length} estudiante(s)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal de lista de evaluaciones
  return (
    <div className="drive-evaluaciones-container">
      <div className="evaluaciones-header">
        <h1>📝 Gestión de Evaluaciones</h1>
        <p>Crea y gestiona evaluaciones organizadas por unidad y clase</p>
        <div className="flujo-info">
          <p><strong>📋 Flujo:</strong> 1️⃣ Crear → 2️⃣ Asignar estudiantes → 3️⃣ Publicar (para que aparezca a los estudiantes)</p>
        </div>
        <button className="btn-nueva-evaluacion" onClick={openModal}>
          + Nueva Evaluación
        </button>
      </div>

      <div className="evaluaciones-grid">
        {Array.isArray(evaluaciones) && evaluaciones.map((evaluacion) => (
          <div key={evaluacion.id} className={`evaluacion-card ${evaluacion.tipo || 'quiz'} ${!evaluacion.activa ? 'inactiva' : ''}`}>
            <div className="evaluacion-header">
              <h3>{evaluacion.titulo}</h3>
              <div className="evaluacion-status">
                <span className={`status-badge ${evaluacion.activa ? 'activa' : 'inactiva'}`}>
                  {evaluacion.activa ? 'PUBLICADA' : 'BORRADOR'}
                </span>
              </div>
            </div>
            
            <div className="evaluacion-info">
              <div className="info-item">
                <span className="label">🎯 Nivel:</span>
                <span className={`value nivel-badge ${evaluacion.nivel}`}>{evaluacion.nivel}</span>
              </div>
              <div className="info-item">
                <span className="label">📚 Unidad:</span>
                <span className="value">{evaluacion.unidad}</span>
              </div>
              <div className="info-item">
                <span className="label">📖 Clase:</span>
                <span className="value">{evaluacion.clase}</span>
              </div>
              <div className="info-item">
                <span className="label">📅 Creada:</span>
                <span className="value">{new Date(evaluacion.fecha_creacion).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="label">👥 Estudiantes:</span>
                <span className="value estudiantes-count">
                  {evaluacion.estudiantes_asignados?.length || 0} asignado(s)
                </span>
              </div>
            </div>

            <div className="evaluacion-enlace">
              {(() => {
                const enlace = evaluacion.enlace || '';
                const esUrlValida = /^https?:\/\/.+/i.test(enlace);
                if (esUrlValida) {
                  return (
                    <a 
                      href={enlace} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="enlace-evaluacion"
                    >
                      🔗 Abrir Evaluación
                    </a>
                  );
                } else if (enlace) {
                  return (
                    <span className="enlace-evaluacion sin-enlace">
                      ⚠️ Enlace inválido: "{enlace}" no es una URL válida
                    </span>
                  );
                } else {
                  return (
                    <span className="enlace-evaluacion sin-enlace">
                      Sin enlace asignado (solo archivo)
                    </span>
                  );
                }
              })()}
            </div>

            <div className="evaluacion-actions">
              <button 
                className="btn-assign"
                onClick={() => openAssignView(evaluacion)}
              >
                👥 Asignar
              </button>
              <button 
                className="btn-toggle"
                onClick={() => toggleActiva(evaluacion.id)}
              >
                {evaluacion.activa ? '📤 Despublicar' : '📢 Publicar'}
              </button>
              <button 
                className="btn-edit"
                onClick={() => handleEdit(evaluacion)}
              >
                ✏️ Editar
              </button>
              <button 
                className="btn-delete"
                onClick={() => handleDelete(evaluacion.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}

        {(!Array.isArray(evaluaciones) || evaluaciones.length === 0) && (
          <div className="no-evaluaciones">
            <p>No hay evaluaciones creadas aún.</p>
            <button className="btn-crear-primera" onClick={openModal}>
              Crear Primera Evaluación
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear/editar evaluación */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingEvaluacion ? 'Editar Evaluación' : 'Nueva Evaluación'}</h2>
              <button className="btn-close" onClick={() => { setEnlaceError(''); setShowModal(false); }}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="evaluacion-form">
              <div className="form-group">
                <label htmlFor="titulo">Título de la Evaluación *</label>
                <input
                  type="text"
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Tarea Unit 1 - Verbos en presente"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tipo">Tipo *</label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="quiz">Quiz</option>
                    <option value="examen">Proyectos</option>
                    <option value="tarea">Tarea</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nivel">Nivel de Inglés *</label>
                  <select
                    id="nivel"
                    value={formData.nivel}
                    onChange={(e) => setFormData(prev => ({ ...prev, nivel: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="">Selecciona el nivel</option>
                    <option value="A1">A1</option>
                    <option value="A1+">A1+</option>
                    <option value="A2">A2</option>
                    <option value="A2+">A2+</option>
                    <option value="B1">B1</option>
                    <option value="B1+">B1+</option>
                    <option value="B2">B2</option>
                    <option value="B2+">B2+</option>
                    <option value="C1">C1</option>
                    <option value="C1+">C1+</option>
                    <option value="C2">C2</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="unidad">Unidad *</label>
                  <input
                    type="text"
                    id="unidad"
                    value={formData.unidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidad: e.target.value }))}
                    placeholder="Ej: Unit 1, Unit 2..."
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="clase">Clase *</label>
                <input
                  type="text"
                  id="clase"
                  value={formData.clase}
                  onChange={(e) => setFormData(prev => ({ ...prev, clase: e.target.value }))}
                  placeholder="Ej: Class 1, Class 2..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="enlace">
                  🔗 Enlace de la Evaluación <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="enlace-input-wrapper" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    id="enlace"
                    value={formData.enlace}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setFormData(prev => ({ ...prev, enlace: valor }));
                      if (valor && !/^https?:\/\/.+/i.test(valor.trim())) {
                        setEnlaceError('El enlace debe empezar con http:// o https://');
                      } else {
                        setEnlaceError('');
                      }
                    }}
                    placeholder="https://forms.gle/... o https://docs.google.com/..."
                    style={{
                      borderColor: enlaceError ? '#ef4444' : formData.enlace && /^https?:\/\/.+/i.test(formData.enlace.trim()) ? '#22c55e' : undefined,
                      flex: 1
                    }}
                  />
                  {formData.enlace && /^https?:\/\/.+/i.test(formData.enlace.trim()) && (
                    <a
                      href={formData.enlace.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-link"
                      style={{
                        padding: '0.6rem 1rem',
                        background: '#667eea',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Abrir
                    </a>
                  )}
                </div>
                {enlaceError && (
                  <small style={{ color: '#ef4444', display: 'block', marginTop: '0.3rem' }}>
                    ⚠️ {enlaceError}
                  </small>
                )}
                {!enlaceError && formData.enlace && /^https?:\/\/.+/i.test(formData.enlace.trim()) && (
                  <small style={{ color: '#22c55e', display: 'block', marginTop: '0.3rem' }}>
                    ✅ URL válida
                  </small>
                )}
                <small style={{ display: 'block', marginTop: '0.3rem', color: '#6b7280' }}>
                  Pega aquí el enlace completo de cualquier plataforma (debe empezar con http:// o https://)
                </small>
              </div>

              {!editingEvaluacion && (
                <div className="form-group">
                  <label htmlFor="archivo">Archivo de la Evaluación (PDF, Word, etc.)</label>
                  <input
                    type="file"
                    id="archivo"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.currentTarget.files && e.currentTarget.files[0] ? e.currentTarget.files[0] : null;
                      setFormData(prev => ({ ...prev, archivo: file }));
                    }}
                  />
                  <small>Puedes subir un archivo en lugar de un enlace. Los estudiantes podrán descargarlo desde su panel.</small>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => { setEnlaceError(''); setShowModal(false); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingEvaluacion ? 'Actualizar' : 'Crear'} Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
