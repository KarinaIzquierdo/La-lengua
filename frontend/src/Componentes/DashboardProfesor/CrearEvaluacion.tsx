import { useState } from 'react';
import './CrearEvaluacion.css';

interface Pregunta {
  id: string;
  tipo: 'multiple' | 'verdadero-falso' | 'completar' | 'ensayo';
  enunciado: string;
  opciones?: string[];
  respuestaCorrecta?: number | string;
  puntos: number;
  explicacion?: string;
}

interface FormularioEvaluacion {
  titulo: string;
  tipo: 'quiz' | 'examen' | 'tarea';
  descripcion: string;
  fechaLimite?: string;
  duracionMinutos?: number;
  intentosPermitidos: number;
  mostrarResultados: boolean;
  estudiantesSeleccionados: string[];
  preguntas: Pregunta[];
}

export default function CrearEvaluacion() {
  const [vistaActiva, setVistaActiva] = useState<'lista' | 'crear'>('lista');
  
  const [formulario, setFormulario] = useState<FormularioEvaluacion>({
    titulo: '',
    tipo: 'quiz',
    descripcion: '',
    fechaLimite: '',
    duracionMinutos: 30,
    intentosPermitidos: 1,
    mostrarResultados: true,
    estudiantesSeleccionados: [],
    preguntas: []
  });

  const [preguntaActual, setPreguntaActual] = useState<Pregunta>({
    id: '',
    tipo: 'multiple',
    enunciado: '',
    opciones: ['', '', '', ''],
    respuestaCorrecta: 0,
    puntos: 1,
    explicacion: ''
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [indiceEdicion, setIndiceEdicion] = useState(-1);

  // Datos de ejemplo de evaluaciones programadas
  const evaluacionesProgramadas = [
    {
      id: '1',
      titulo: 'Quiz de Vocabulario - Unidad 3',
      tipo: 'quiz',
      fechaCreacion: '2025-08-28',
      fechaLimite: '2025-09-05',
      estudiantes: 12,
      completadas: 8,
      promedio: 85,
      estado: 'activa'
    },
    {
      id: '2',
      titulo: 'Examen Parcial - Present Perfect',
      tipo: 'examen',
      fechaCreacion: '2025-08-25',
      fechaLimite: '2025-09-02',
      estudiantes: 15,
      completadas: 15,
      promedio: 78,
      estado: 'completada'
    },
    {
      id: '3',
      titulo: 'Tarea - Ensayo sobre Cultura Inglesa',
      tipo: 'tarea',
      fechaCreacion: '2025-08-30',
      fechaLimite: '2025-09-10',
      estudiantes: 10,
      completadas: 3,
      promedio: 92,
      estado: 'activa'
    }
  ];

  const estudiantesDisponibles = [
    { id: '1', nombre: 'Ana García', nivel: 'Intermedio' },
    { id: '2', nombre: 'Carlos López', nivel: 'Básico' },
    { id: '3', nombre: 'María Rodríguez', nivel: 'Avanzado' },
    { id: '4', nombre: 'Pedro Martín', nivel: 'Intermedio' },
    { id: '5', nombre: 'Laura Silva', nivel: 'Básico' },
    { id: '6', nombre: 'José Hernández', nivel: 'Avanzado' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreguntaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPreguntaActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpcionChange = (index: number, valor: string) => {
    setPreguntaActual(prev => ({
      ...prev,
      opciones: prev.opciones?.map((opcion, i) => i === index ? valor : opcion) || []
    }));
  };

  const agregarPregunta = () => {
    if (!preguntaActual.enunciado.trim()) return;

    const nuevaPregunta: Pregunta = {
      ...preguntaActual,
      id: Date.now().toString()
    };

    if (modoEdicion) {
      const nuevasPreguntas = [...formulario.preguntas];
      nuevasPreguntas[indiceEdicion] = nuevaPregunta;
      setFormulario(prev => ({ ...prev, preguntas: nuevasPreguntas }));
      setModoEdicion(false);
      setIndiceEdicion(-1);
    } else {
      setFormulario(prev => ({
        ...prev,
        preguntas: [...prev.preguntas, nuevaPregunta]
      }));
    }

    // Resetear pregunta actual
    setPreguntaActual({
      id: '',
      tipo: 'multiple',
      enunciado: '',
      opciones: ['', '', '', ''],
      respuestaCorrecta: 0,
      puntos: 1,
      explicacion: ''
    });
  };

  const editarPregunta = (index: number) => {
    setPreguntaActual(formulario.preguntas[index]);
    setModoEdicion(true);
    setIndiceEdicion(index);
  };

  const eliminarPregunta = (index: number) => {
    setFormulario(prev => ({
      ...prev,
      preguntas: prev.preguntas.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Evaluación creada:', formulario);
    // Aquí iría la lógica para enviar al backend
    alert('Evaluación creada exitosamente!');
    
    // Resetear formulario
    setFormulario({
      titulo: '',
      tipo: 'quiz',
      descripcion: '',
      fechaLimite: '',
      duracionMinutos: 30,
      intentosPermitidos: 1,
      mostrarResultados: true,
      estudiantesSeleccionados: [],
      preguntas: []
    });
    
    setVistaActiva('lista');
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'activa': { class: 'badge-active', text: 'Activa' },
      'completada': { class: 'badge-completed', text: 'Completada' },
      'pendiente': { class: 'badge-pending', text: 'Pendiente' }
    };
    return badges[estado as keyof typeof badges] || badges.pendiente;
  };

  const getTipoBadge = (tipo: string) => {
    const badges = {
      'quiz': { class: 'badge-quiz', text: 'Quiz', icon: '📝' },
      'examen': { class: 'badge-exam', text: 'Proyectos', icon: '📋' },
      'tarea': { class: 'badge-task', text: 'Tarea', icon: '📚' }
    };
    return badges[tipo as keyof typeof badges] || badges.quiz;
  };

  return (
    <div className="crear-evaluacion-container">
      <div className="evaluacion-header">
        <div className="header-content">
          <div className="header-text">
            <h2>Evaluaciones</h2>
            <p>Gestiona y crea evaluaciones para tus estudiantes</p>
          </div>
          <div className="header-actions">
            <button 
              className={`tab-button ${vistaActiva === 'lista' ? 'active' : ''}`}
              onClick={() => setVistaActiva('lista')}
            >
              📋 Mis Evaluaciones
            </button>
            <button 
              className={`tab-button ${vistaActiva === 'crear' ? 'active' : ''}`}
              onClick={() => setVistaActiva('crear')}
            >
              ➕ Crear Nueva
            </button>
          </div>
        </div>
      </div>

      {vistaActiva === 'lista' ? (
        <div className="evaluaciones-lista">
          <div className="lista-header">
            <h3>Evaluaciones Programadas</h3>
            <div className="stats-summary">
              <span className="stat-item">
                <strong>{evaluacionesProgramadas.length}</strong> Total
              </span>
              <span className="stat-item">
                <strong>{evaluacionesProgramadas.filter(e => e.estado === 'activa').length}</strong> Activas
              </span>
              <span className="stat-item">
                <strong>{evaluacionesProgramadas.filter(e => e.estado === 'completada').length}</strong> Completadas
              </span>
            </div>
          </div>

          <div className="evaluaciones-table">
            <div className="table-header">
              <div className="col-titulo">Título</div>
              <div className="col-tipo">Tipo</div>
              <div className="col-fecha">Fecha Límite</div>
              <div className="col-estudiantes">Estudiantes</div>
              <div className="col-progreso">Progreso</div>
              <div className="col-promedio">Promedio</div>
              <div className="col-estado">Estado</div>
              <div className="col-acciones">Acciones</div>
            </div>

            {evaluacionesProgramadas.map((evaluacion) => {
              const tipoBadge = getTipoBadge(evaluacion.tipo);
              const estadoBadge = getEstadoBadge(evaluacion.estado);
              const progreso = Math.round((evaluacion.completadas / evaluacion.estudiantes) * 100);

              return (
                <div key={evaluacion.id} className="table-row">
                  <div className="col-titulo">
                    <div className="titulo-info">
                      <h4>{evaluacion.titulo}</h4>
                      <span className="fecha-creacion">Creada: {evaluacion.fechaCreacion}</span>
                    </div>
                  </div>
                  <div className="col-tipo">
                    <span className={`tipo-badge ${tipoBadge.class}`}>
                      {tipoBadge.icon} {tipoBadge.text}
                    </span>
                  </div>
                  <div className="col-fecha">
                    {evaluacion.fechaLimite}
                  </div>
                  <div className="col-estudiantes">
                    {evaluacion.estudiantes}
                  </div>
                  <div className="col-progreso">
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {evaluacion.completadas}/{evaluacion.estudiantes} ({progreso}%)
                      </span>
                    </div>
                  </div>
                  <div className="col-promedio">
                    <span className={`promedio ${evaluacion.promedio >= 80 ? 'good' : evaluacion.promedio >= 60 ? 'average' : 'low'}`}>
                      {evaluacion.promedio}%
                    </span>
                  </div>
                  <div className="col-estado">
                    <span className={`estado-badge ${estadoBadge.class}`}>
                      {estadoBadge.text}
                    </span>
                  </div>
                  <div className="col-acciones">
                    <button className="action-btn view" title="Ver detalles">
                      👁️
                    </button>
                    <button className="action-btn edit" title="Editar">
                      ✏️
                    </button>
                    <button className="action-btn delete" title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="crear-evaluacion-form">
          <div className="form-header">
            <h3>Crear Nueva Evaluación</h3>
            <p>Diseña quizzes, exámenes y tareas personalizadas para tus estudiantes</p>
          </div>

          <form onSubmit={handleSubmit} className="evaluacion-form">
            {/* Información básica */}
            <div className="form-section">
              <h4>Información Básica</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="titulo">Título de la Evaluación</label>
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
                  <label htmlFor="tipo">Tipo de Evaluación</label>
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

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el contenido y objetivos de la evaluación..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fechaLimite">Fecha Límite</label>
                  <input
                    type="date"
                    id="fechaLimite"
                    name="fechaLimite"
                    value={formulario.fechaLimite}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="duracionMinutos">Duración (minutos)</label>
                  <input
                    type="number"
                    id="duracionMinutos"
                    name="duracionMinutos"
                    value={formulario.duracionMinutos}
                    onChange={handleInputChange}
                    min="1"
                    max="300"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="intentosPermitidos">Intentos Permitidos</label>
                  <input
                    type="number"
                    id="intentosPermitidos"
                    name="intentosPermitidos"
                    value={formulario.intentosPermitidos}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>

            {/* Creador de preguntas */}
            <div className="form-section">
              <h4>Crear Preguntas</h4>
              <div className="question-creator">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tipo-pregunta">Tipo de Pregunta</label>
                    <select
                      id="tipo-pregunta"
                      name="tipo"
                      value={preguntaActual.tipo}
                      onChange={handlePreguntaChange}
                    >
                      <option value="multiple">Opción Múltiple</option>
                      <option value="verdadero-falso">Verdadero/Falso</option>
                      <option value="completar">Completar</option>
                      <option value="ensayo">Ensayo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="puntos">Puntos</label>
                    <input
                      type="number"
                      id="puntos"
                      name="puntos"
                      value={preguntaActual.puntos}
                      onChange={handlePreguntaChange}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="enunciado">Enunciado de la Pregunta</label>
                  <textarea
                    id="enunciado"
                    name="enunciado"
                    value={preguntaActual.enunciado}
                    onChange={handlePreguntaChange}
                    placeholder="Escribe la pregunta aquí..."
                    rows={2}
                    required
                  />
                </div>

                {(preguntaActual.tipo === 'multiple' || preguntaActual.tipo === 'verdadero-falso') && (
                  <div className="opciones-container">
                    <label>Opciones de Respuesta</label>
                    {preguntaActual.opciones?.map((opcion, index) => (
                      <div key={index} className="opcion-row">
                        <input
                          type="text"
                          value={opcion}
                          onChange={(e) => handleOpcionChange(index, e.target.value)}
                          placeholder={`Opción ${index + 1}`}
                        />
                        <input
                          type="radio"
                          name="respuesta-correcta"
                          checked={preguntaActual.respuestaCorrecta === index}
                          onChange={() => setPreguntaActual(prev => ({ ...prev, respuestaCorrecta: index }))}
                        />
                        <label>Correcta</label>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="explicacion">Explicación (Opcional)</label>
                  <textarea
                    id="explicacion"
                    name="explicacion"
                    value={preguntaActual.explicacion}
                    onChange={handlePreguntaChange}
                    placeholder="Explica por qué esta es la respuesta correcta..."
                    rows={2}
                  />
                </div>

                <div className="creator-actions">
                  <button type="button" onClick={agregarPregunta} className="btn-add-question">
                    {modoEdicion ? 'Actualizar Pregunta' : 'Agregar Pregunta'}
                  </button>
                  {modoEdicion && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setModoEdicion(false);
                        setIndiceEdicion(-1);
                        setPreguntaActual({
                          id: '',
                          tipo: 'multiple',
                          enunciado: '',
                          opciones: ['', '', '', ''],
                          respuestaCorrecta: 0,
                          puntos: 1,
                          explicacion: ''
                        });
                      }}
                      className="btn-cancel"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de preguntas creadas */}
            {formulario.preguntas.length > 0 && (
              <div className="form-section">
                <h4>Preguntas Creadas ({formulario.preguntas.length})</h4>
                <div className="preguntas-lista">
                  {formulario.preguntas.map((pregunta, index) => (
                    <div key={pregunta.id} className="pregunta-item">
                      <div className="pregunta-header">
                        <span className="pregunta-numero">#{index + 1}</span>
                        <span className="pregunta-tipo">{pregunta.tipo}</span>
                        <span className="pregunta-puntos">{pregunta.puntos} pts</span>
                        <div className="pregunta-actions">
                          <button type="button" onClick={() => editarPregunta(index)}>✏️</button>
                          <button type="button" onClick={() => eliminarPregunta(index)}>🗑️</button>
                        </div>
                      </div>
                      <div className="pregunta-content">
                        <p>{pregunta.enunciado}</p>
                        {pregunta.opciones && (
                          <ul className="opciones-preview">
                            {pregunta.opciones.map((opcion, i) => (
                              <li key={i} className={pregunta.respuestaCorrecta === i ? 'correcta' : ''}>
                                {opcion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Asignación de estudiantes */}
            <div className="form-section">
              <h4>Asignar a Estudiantes</h4>
              <div className="estudiantes-selector">
                {estudiantesDisponibles.map((estudiante) => (
                  <label key={estudiante.id} className="estudiante-checkbox">
                    <input
                      type="checkbox"
                      checked={formulario.estudiantesSeleccionados.includes(estudiante.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormulario(prev => ({
                            ...prev,
                            estudiantesSeleccionados: [...prev.estudiantesSeleccionados, estudiante.id]
                          }));
                        } else {
                          setFormulario(prev => ({
                            ...prev,
                            estudiantesSeleccionados: prev.estudiantesSeleccionados.filter(id => id !== estudiante.id)
                          }));
                        }
                      }}
                    />
                    <span className="estudiante-info">
                      <strong>{estudiante.nombre}</strong>
                      <span className="nivel">{estudiante.nivel}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Configuración adicional */}
            <div className="form-section">
              <h4>Configuración Adicional</h4>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="mostrarResultados"
                    checked={formulario.mostrarResultados}
                    onChange={(e) => setFormulario(prev => ({ ...prev, mostrarResultados: e.target.checked }))}
                  />
                  Mostrar resultados inmediatamente después de completar
                </label>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
              <button type="button" onClick={() => setVistaActiva('lista')} className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={formulario.preguntas.length === 0}>
                Crear Evaluación
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
