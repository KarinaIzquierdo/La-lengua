import { useState, useEffect } from 'react';
import './SubirEvaluaciones.css';
import evaluacionService from '../../services/evaluacionService';

interface EvaluacionSubida {
  id: string;
  titulo: string;
  descripcion?: string;
  archivo?: File;
  archivo_url?: string;
  tipo: 'quiz' | 'examen' | 'tarea';
  fecha_limite?: string;
  created_at: string;
  estudiantes_asignados: string[];
  estado: 'borrador' | 'publicada' | 'archivada';
  profesor_nombre?: string;
  estudiantes_count?: number;
  completadas_count?: number;
}

interface Estudiante {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  level?: string;
  role: string;
}

export default function SubirEvaluaciones() {
  const [evaluacionesSubidas, setEvaluacionesSubidas] = useState<EvaluacionSubida[]>([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [formulario, setFormulario] = useState({
    titulo: '',
    tipo: 'quiz' as 'quiz' | 'examen' | 'tarea',
    descripcion: '',
    fechaLimite: '',
    estudiantesSeleccionados: [] as string[]
  });

  const [filtros, setFiltros] = useState({
    busqueda: '',
    nivel: 'todos'
  });

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalVer, setMostrarModalVer] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<EvaluacionSubida | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadEvaluaciones();
    loadStudents();
  }, []);

  const loadEvaluaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionService.getEvaluaciones();
      if (response.success) {
        setEvaluacionesSubidas(response.data || []);
      } else {
        setError('No se pudieron cargar las evaluaciones');
      }
    } catch (err) {
      setError('Error al cargar evaluaciones');
      console.error('Error loading evaluaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await evaluacionService.getStudents();
      if (response.success) {
        setEstudiantesDisponibles(response.data || []);
      }
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      // Validar tipo de archivo
      const tiposPermitidos = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];
      
      if (tiposPermitidos.includes(archivo.type)) {
        setArchivoSeleccionado(archivo);
      } else {
        alert('Por favor selecciona un archivo PDF, Word o de texto');
        e.target.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEstudianteToggle = (estudianteId: string) => {
    setFormulario(prev => ({
      ...prev,
      estudiantesSeleccionados: prev.estudiantesSeleccionados.includes(estudianteId)
        ? prev.estudiantesSeleccionados.filter(id => id !== estudianteId)
        : [...prev.estudiantesSeleccionados, estudianteId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!archivoSeleccionado) {
      alert('Por favor selecciona un archivo');
      return;
    }

    if (formulario.estudiantesSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un estudiante');
      return;
    }

    try {
      setLoading(true);
      const evaluacionData = {
        titulo: formulario.titulo,
        descripcion: formulario.descripcion,
        tipo: formulario.tipo,
        archivo: archivoSeleccionado,
        fecha_limite: formulario.fechaLimite || undefined,
        estudiantes_asignados: formulario.estudiantesSeleccionados,
        estado: 'borrador' as const
      };
      
      // Usar el servicio de evaluaciones para crear
      const response = await evaluacionService.createEvaluacion(evaluacionData);
      
      if (response.success) {
        // Resetear formulario
        setFormulario({
          titulo: '',
          tipo: 'quiz',
          descripcion: '',
          fechaLimite: '',
          estudiantesSeleccionados: []
        });
        setArchivoSeleccionado(null);
        setMostrarFormulario(false);
        
        await loadEvaluaciones(); // Recargar la lista
        alert('Evaluación subida exitosamente');
      } else {
        throw new Error(response.message || 'Error al crear la evaluación');
      }
    } catch (err) {
      console.error('Error creating evaluacion:', err);
      alert(err instanceof Error ? err.message : 'Error al crear la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const publicarEvaluacion = async (id: string) => {
    try {
      setLoading(true);
      const response = await evaluacionService.publishEvaluacion(id);
      if (response.success) {
        await loadEvaluaciones(); // Recargar la lista
        alert('Evaluación publicada exitosamente');
      }
    } catch (err) {
      alert('Error al publicar la evaluación');
      console.error('Error publishing evaluacion:', err);
    } finally {
      setLoading(false);
    }
  };

  const eliminarEvaluacion = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta evaluación?')) {
      try {
        setLoading(true);
        const response = await evaluacionService.deleteEvaluacion(id);
        if (response.success) {
          await loadEvaluaciones(); // Recargar la lista
          alert('Evaluación eliminada exitosamente');
        }
      } catch (err) {
        alert('Error al eliminar la evaluación');
        console.error('Error deleting evaluacion:', err);
      } finally {
        setLoading(false);
      }
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

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'borrador': { class: 'badge-draft', text: 'Borrador' },
      'publicada': { class: 'badge-published', text: 'Publicada' },
      'archivada': { class: 'badge-archived', text: 'Archivada' }
    };
    return badges[estado as keyof typeof badges] || badges.borrador;
  };

  const getIconoArchivo = (archivo: File | null | undefined) => {
    if (!archivo) return '📄';
    if (archivo.type?.includes('pdf')) return '📄';
    if (archivo.type?.includes('word') || archivo.type?.includes('document')) return '📝';
    return '📄';
  };

  return (
    <div className="subir-evaluaciones-container">
      <div className="evaluaciones-header">
        <div className="header-content">
          <div className="header-text">
            <h2>📚 Gestión de Evaluaciones</h2>
            <p>Sube y administra evaluaciones para tus estudiantes</p>
          </div>
          <button 
            className="btn-nueva-evaluacion"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? '❌ Cancelar' : '📤 Subir Nueva Evaluación'}
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="formulario-subida">
          <div className="form-header">
            <h3>📤 Subir Nueva Evaluación</h3>
            <p>Sube un archivo de evaluación y asígnalo a tus estudiantes</p>
          </div>

          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-section">
              <h4>📄 Archivo de Evaluación</h4>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="archivo"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleArchivoChange}
                  className="file-input"
                />
                <label htmlFor="archivo" className="file-label">
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    {archivoSeleccionado ? (
                      <>
                        <strong>{archivoSeleccionado.name}</strong>
                        <span>({(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </>
                    ) : (
                      <>
                        <strong>Haz clic para seleccionar archivo</strong>
                        <span>PDF, Word o texto (máx. 10MB)</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h4>ℹ️ Información de la Evaluación</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="titulo">Título</label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    value={formulario.titulo}
                    onChange={handleInputChange}
                    placeholder="Ej: Quiz de Vocabulario - Unidad 3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tipo">Tipo</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formulario.tipo}
                    onChange={handleInputChange}
                  >
                    <option value="quiz">Quiz</option>
                    <option value="examen">Proyectos</option>
                    <option value="tarea">Tarea</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="descripcion">Descripción (Opcional)</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={handleInputChange}
                    placeholder="Describe el contenido de la evaluación..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fechaLimite">Fecha Límite (Opcional)</label>
                  <input
                    type="date"
                    id="fechaLimite"
                    name="fechaLimite"
                    value={formulario.fechaLimite}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>👥 Asignar a Estudiantes</h4>
              
              {/* Filtros */}
              <div className="filtros-container">
                <div className="filtro-busqueda">
                  <input
                    type="text"
                    placeholder="🔍 Buscar estudiante..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros(prev => ({...prev, busqueda: e.target.value}))}
                    className="input-busqueda"
                  />
                </div>
                <div className="filtro-nivel">
                  <select
                    value={filtros.nivel}
                    onChange={(e) => setFiltros(prev => ({...prev, nivel: e.target.value}))}
                    className="select-nivel"
                  >
                    <option value="todos">Todos los niveles</option>
                    <option value="A1">A1 - Principiante</option>
                    <option value="A2">A2 - Elemental</option>
                    <option value="B1">B1 - Intermedio</option>
                    <option value="B2">B2 - Intermedio Alto</option>
                    <option value="C1">C1 - Avanzado</option>
                    <option value="C2">C2 - Competencia</option>
                  </select>
                </div>
                <div className="acciones-seleccion">
                  <button
                    type="button"
                    onClick={() => {
                      const estudiantesFiltrados = estudiantesDisponibles.filter(estudiante => {
                        const nombreCompleto = `${estudiante.first_name} ${estudiante.last_name}`.toLowerCase();
                        const coincideNombre = nombreCompleto.includes(filtros.busqueda.toLowerCase());
                        const coincideNivel = filtros.nivel === 'todos' || estudiante.level === filtros.nivel;
                        return coincideNombre && coincideNivel;
                      });
                      const idsEstudiantesFiltrados = estudiantesFiltrados.map(e => e.id);
                      setFormulario(prev => ({
                        ...prev,
                        estudiantesSeleccionados: [...new Set([...prev.estudiantesSeleccionados, ...idsEstudiantesFiltrados])]
                      }));
                    }}
                    className="btn-seleccionar-todos"
                  >
                    ✅ Seleccionar visibles
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormulario(prev => ({...prev, estudiantesSeleccionados: []}))}
                    className="btn-deseleccionar-todos"
                  >
                    ❌ Deseleccionar todos
                  </button>
                </div>
              </div>
              
              <div className="estudiantes-container">
                <div className="estudiantes-grid">
                {estudiantesDisponibles
                  .filter(estudiante => {
                    const nombreCompleto = `${estudiante.first_name} ${estudiante.last_name}`.toLowerCase();
                    const coincideNombre = nombreCompleto.includes(filtros.busqueda.toLowerCase());
                    const coincideNivel = filtros.nivel === 'todos' || estudiante.level === filtros.nivel;
                    return coincideNombre && coincideNivel;
                  })
                  .map((estudiante) => (
                  <label key={estudiante.id} className="estudiante-card">
                    <input
                      type="checkbox"
                      checked={formulario.estudiantesSeleccionados.includes(estudiante.id)}
                      onChange={() => handleEstudianteToggle(estudiante.id)}
                    />
                    <div className="estudiante-info">
                      <div className="estudiante-avatar">
                        {`${estudiante.first_name} ${estudiante.last_name}`.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="estudiante-details">
                        <span className="nombre">{`${estudiante.first_name} ${estudiante.last_name}`}</span>
                        <span className="nivel">{estudiante.level || 'No especificado'}</span>
                      </div>
                    </div>
                  </label>
                ))}
                </div>
              </div>
              
              <div className="seleccion-info">
                <span>
                  {formulario.estudiantesSeleccionados.length} estudiante(s) seleccionado(s)
                </span>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setMostrarFormulario(false)}
                className="btn-cancelar"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-subir"
                disabled={!archivoSeleccionado || formulario.estudiantesSeleccionados.length === 0}
              >
                📤 Subir Evaluación
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="evaluaciones-lista">
        <div className="lista-header">
          <h3>📋 Evaluaciones Subidas</h3>
          <div className="stats-summary">
            <span className="stat-item">
              <strong>{evaluacionesSubidas.length}</strong> Total
            </span>
            <span className="stat-item">
              <strong>{evaluacionesSubidas.filter(evaluacion => evaluacion.estado === 'publicada').length}</strong> Publicadas
            </span>
            <span className="stat-item">
              <strong>{evaluacionesSubidas.filter(evaluacion => evaluacion.estado === 'borrador').length}</strong> Borradores
            </span>
          </div>
        </div>

        <div className="evaluaciones-grid">
          {evaluacionesSubidas.map((evaluacion) => {
            const tipoBadge = getTipoBadge(evaluacion.tipo);
            const estadoBadge = getEstadoBadge(evaluacion.estado);
            const estudiantesAsignados = estudiantesDisponibles.filter(estudiante => 
              evaluacion.estudiantes_asignados.includes(estudiante.id)
            );

            return (
              <div key={evaluacion.id} className="evaluacion-card">
                <div className="card-header">
                  <div className="titulo-section">
                    <h4>{evaluacion.titulo}</h4>
                    <div className="badges">
                      <span className={`tipo-badge ${tipoBadge.class}`}>
                        {tipoBadge.icon} {tipoBadge.text}
                      </span>
                      <span className={`estado-badge ${estadoBadge.class}`}>
                        {estadoBadge.text}
                      </span>
                    </div>
                  </div>
                  <div className="archivo-info">
                    <span className="archivo-icon">
                      {evaluacion.archivo ? getIconoArchivo(evaluacion.archivo) : '📄'}
                    </span>
                    <span className="archivo-nombre">
                      {evaluacion.archivo?.name || 'Archivo subido'}
                    </span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Fecha de subida:</span>
                    <span className="value">{new Date(evaluacion.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Estudiantes asignados:</span>
                    <span className="value">{evaluacion.estudiantes_asignados.length}</span>
                  </div>
                  
                  <div className="estudiantes-asignados">
                    <span className="label">Asignado a:</span>
                    <div className="estudiantes-list">
                      {estudiantesAsignados.map(estudiante => (
                        <span key={estudiante.id} className="estudiante-tag">
                          {`${estudiante.first_name} ${estudiante.last_name}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn-action btn-publicar"
                    onClick={() => publicarEvaluacion(evaluacion.id)}
                    disabled={evaluacion.estado === 'publicada'}
                  >
                    {evaluacion.estado === 'publicada' ? '✅ Publicada' : '🚀 Publicar'}
                  </button>
                  <button 
                    className="btn-action btn-ver"
                    onClick={() => {
                      setEvaluacionSeleccionada(evaluacion);
                      setMostrarModalVer(true);
                    }}
                  >
                    👁️ Ver
                  </button>
                  <button 
                    className="btn-action btn-editar"
                    onClick={() => {
                      setEvaluacionSeleccionada(evaluacion);
                      setMostrarModalEditar(true);
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn-action btn-eliminar"
                    onClick={() => eliminarEvaluacion(evaluacion.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {evaluacionesSubidas.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No hay evaluaciones subidas</h3>
            <p>Sube tu primera evaluación para que aparezca aquí</p>
            <button 
              className="btn-empty-action"
              onClick={() => setMostrarFormulario(true)}
            >
              📤 Subir Primera Evaluación
            </button>
          </div>
        )}
      </div>

      {/* Modal Ver Evaluación */}
      {mostrarModalVer && evaluacionSeleccionada && (
        <div className="modal-overlay" onClick={() => setMostrarModalVer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👁️ Ver Evaluación</h3>
              <button className="close-btn" onClick={() => setMostrarModalVer(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="evaluacion-detalle">
                <h4>{evaluacionSeleccionada.titulo}</h4>
                <p><strong>Descripción:</strong> {evaluacionSeleccionada.descripcion || 'Sin descripción'}</p>
                <p><strong>Tipo:</strong> {evaluacionSeleccionada.tipo}</p>
                <p><strong>Estado:</strong> {evaluacionSeleccionada.estado}</p>
                <p><strong>Fecha límite:</strong> {evaluacionSeleccionada.fecha_limite || 'Sin fecha límite'}</p>
                <p><strong>Estudiantes asignados:</strong> {evaluacionSeleccionada.estudiantes_count || 0}</p>
                
                <div className="estudiantes-lista">
                  <h5>Estudiantes asignados:</h5>
                  <div className="estudiantes-tags">
                    {estudiantesDisponibles
                      .filter(estudiante => evaluacionSeleccionada.estudiantes_asignados.includes(estudiante.id))
                      .map(estudiante => (
                        <span key={estudiante.id} className="estudiante-tag">
                          {`${estudiante.first_name} ${estudiante.last_name}`}
                        </span>
                      ))}
                  </div>
                </div>

                {evaluacionSeleccionada.archivo_url && (
                  <div className="archivo-descarga">
                    <a href={evaluacionSeleccionada.archivo_url} target="_blank" rel="noopener noreferrer" className="btn-descargar">
                      📄 Descargar Archivo
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Evaluación */}
      {mostrarModalEditar && evaluacionSeleccionada && (
        <div className="modal-overlay" onClick={() => setMostrarModalEditar(false)}>
          <div className="modal-content modal-editar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Editar Evaluación</h3>
              <button className="close-btn" onClick={() => setMostrarModalEditar(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault();
                // Aquí iría la lógica de actualización
                console.log('Actualizar evaluación:', evaluacionSeleccionada.id);
                setMostrarModalEditar(false);
              }}>
                <div className="form-group">
                  <label>Título:</label>
                  <input 
                    type="text" 
                    defaultValue={evaluacionSeleccionada.titulo}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Descripción:</label>
                  <textarea 
                    defaultValue={evaluacionSeleccionada.descripcion || ''}
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha límite:</label>
                  <input 
                    type="date" 
                    defaultValue={evaluacionSeleccionada.fecha_limite}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Reasignar estudiantes:</label>
                  <div className="estudiantes-selector">
                    <div className="filtros-container">
                      <input
                        type="text"
                        placeholder="🔍 Buscar estudiante..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({...prev, busqueda: e.target.value}))}
                        className="input-busqueda"
                      />
                      <select
                        value={filtros.nivel}
                        onChange={(e) => setFiltros(prev => ({...prev, nivel: e.target.value}))}
                        className="select-nivel"
                      >
                        <option value="todos">Todos los niveles</option>
                        <option value="A1">A1 - Principiante</option>
                        <option value="A2">A2 - Elemental</option>
                        <option value="B1">B1 - Intermedio</option>
                        <option value="B2">B2 - Intermedio Alto</option>
                        <option value="C1">C1 - Avanzado</option>
                        <option value="C2">C2 - Competencia</option>
                      </select>
                    </div>
                    
                    <div className="estudiantes-grid-modal">
                      {estudiantesDisponibles
                        .filter(estudiante => {
                          const nombreCompleto = `${estudiante.first_name} ${estudiante.last_name}`.toLowerCase();
                          const coincideNombre = nombreCompleto.includes(filtros.busqueda.toLowerCase());
                          const coincideNivel = filtros.nivel === 'todos' || estudiante.level === filtros.nivel;
                          return coincideNombre && coincideNivel;
                        })
                        .map(estudiante => (
                          <div key={estudiante.id} className="estudiante-item-modal">
                            <input
                              type="checkbox"
                              id={`edit-${estudiante.id}`}
                              defaultChecked={evaluacionSeleccionada.estudiantes_asignados.includes(estudiante.id)}
                            />
                            <label htmlFor={`edit-${estudiante.id}`}>
                              <div className="estudiante-info">
                                <span className="nombre">{estudiante.first_name} {estudiante.last_name}</span>
                                <span className="nivel">{estudiante.level}</span>
                              </div>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancelar" onClick={() => setMostrarModalEditar(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    💾 Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
