import { useState, useEffect } from 'react';
import './ProgramarClase.css';
import { userService } from '../../services/userService';

interface EstudianteDisponible {
  id: string;
  nombre: string;
  nivel: string;
  email: string;
}

interface FormularioClase {
  fecha: string;
  hora: string;
  duracion: number;
  tema: string;
  descripcion: string;
  estudiantesSeleccionados: string[];
  tipoClase: 'individual' | 'grupal';
  modalidad: 'presencial' | 'virtual';
  meetLink?: string;
}

export default function ProgramarClase() {
  const [formulario, setFormulario] = useState<FormularioClase>({
    fecha: '',
    hora: '',
    duracion: 60,
    tema: '',
    descripcion: '',
    estudiantesSeleccionados: [],
    tipoClase: 'individual',
    modalidad: 'virtual',
    meetLink: ''
  });

  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState<EstudianteDisponible[]>([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(true);

  const [mostrarEstudiantes, setMostrarEstudiantes] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [seleccionarTodos, setSeleccionarTodos] = useState(false);

  const temasComunes = [
    'Conversación Básica',
    'Gramática Avanzada',
    'Vocabulario de Negocios',
    'Pronunciación',
    'Comprensión Auditiva',
    'Escritura Académica',
    'Inglés Conversacional',
    'Preparación TOEFL',
    'Inglés para Viajes'
  ];

  const nivelesSistema = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];
  const nivelesBaseOrden = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const normalizarNivel = (nivel: string | null | undefined) => {
    const v = (nivel ?? '').trim();
    return v === '' ? 'Sin nivel' : v;
  };

  const ordenarNiveles = (a: string, b: string) => {
    const na = normalizarNivel(a);
    const nb = normalizarNivel(b);

    if (na === 'Sin nivel' && nb !== 'Sin nivel') return 1;
    if (nb === 'Sin nivel' && na !== 'Sin nivel') return -1;

    const ra = /^([ABC][12])(\+*)$/.exec(na);
    const rb = /^([ABC][12])(\+*)$/.exec(nb);

    const baseA = ra ? ra[1] : na;
    const baseB = rb ? rb[1] : nb;
    const idxA = nivelesBaseOrden.indexOf(baseA);
    const idxB = nivelesBaseOrden.indexOf(baseB);
    const orderA = idxA >= 0 ? idxA : 999;
    const orderB = idxB >= 0 ? idxB : 999;
    if (orderA !== orderB) return orderA - orderB;

    const plusA = ra ? ra[2].length : 0;
    const plusB = rb ? rb[2].length : 0;
    if (plusA !== plusB) return plusA - plusB;

    return na.localeCompare(nb, 'es', { sensitivity: 'base' });
  };

  // Cargar estudiantes reales de la base de datos
  useEffect(() => {
    const cargarEstudiantes = async () => {
      setCargandoEstudiantes(true);
      try {
        const usuarios = await userService.getAll();
        const estudiantes = usuarios
          .filter(usuario => {
            return usuario.rol === 'student' && usuario.activo;
          })
          .map(usuario => {
            const nivel = usuario.nivel || 'Sin nivel';

            return {
              id: usuario.id.toString(),
              nombre: `${usuario.nombres} ${usuario.apellidos}`,
              nivel,
              email: usuario.correo || usuario.correo_personal || ''
            };
          });
        
        setEstudiantesDisponibles(estudiantes);
      } catch (error) {
        console.error('Error cargando estudiantes:', error);
        setEstudiantesDisponibles([]);
      } finally {
        setCargandoEstudiantes(false);
      }
    };

    cargarEstudiantes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const toggleEstudiante = (estudianteId: string) => {
    setFormulario(prev => ({
      ...prev,
      estudiantesSeleccionados: prev.estudiantesSeleccionados.includes(estudianteId)
        ? prev.estudiantesSeleccionados.filter(id => id !== estudianteId)
        : [...prev.estudiantesSeleccionados, estudianteId]
    }));
  };

  // Función para seleccionar/deseleccionar todos los estudiantes filtrados
  const toggleSeleccionarTodos = () => {
    const estudiantesFiltradosIds = estudiantesFiltrados.map(e => e.id);
    if (seleccionarTodos) {
      // Deseleccionar todos los filtrados
      setFormulario(prev => ({
        ...prev,
        estudiantesSeleccionados: prev.estudiantesSeleccionados.filter(id => 
          !estudiantesFiltradosIds.includes(id)
        )
      }));
    } else {
      // Seleccionar todos los filtrados
      setFormulario(prev => ({
        ...prev,
        estudiantesSeleccionados: [...new Set([...prev.estudiantesSeleccionados, ...estudiantesFiltradosIds])]
      }));
    }
    setSeleccionarTodos(!seleccionarTodos);
  };

  const nivelesDisponibles = Array.from(
    new Set(estudiantesDisponibles.map(e => normalizarNivel(e.nivel)))
  );

  const nivelesExtra = nivelesDisponibles
    .filter(n => n !== 'Sin nivel' && !nivelesSistema.includes(n))
    .sort(ordenarNiveles);

  const nivelesDisponiblesOrdenados = [
    ...nivelesSistema,
    ...nivelesExtra,
    'Sin nivel'
  ];

  const estudiantesFiltrados = estudiantesDisponibles.filter(estudiante => {
    if (filtroNivel === 'todos') return true;

    const nivelEst = normalizarNivel(estudiante.nivel);
    const nivelFiltro = normalizarNivel(filtroNivel);
    return nivelEst.toLowerCase() === nivelFiltro.toLowerCase();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Obtener el nombre del profesor desde localStorage
      const userStr = localStorage.getItem('user');
      let nombreProfesor = 'Profesor';
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          nombreProfesor = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } catch (e) {
          console.error('Error parseando usuario:', e);
        }
      }
      
      // Preparar datos para enviar al backend
      const claseData = {
        nombre: formulario.tema,
        profesor: nombreProfesor,
        fecha: formulario.fecha,
        hora: formulario.hora,
        duracion: formulario.duracion,
        tema: formulario.tema,
        descripcion: formulario.descripcion,
        tipo_clase: formulario.tipoClase,
        modalidad: formulario.modalidad,
        meet_link: formulario.meetLink,
        estudiantesSeleccionados: formulario.estudiantesSeleccionados
      };

      
      // Enviar al backend usando ClaseService
      const { ClaseService } = await import('../../services/claseService');
      const claseCreada = await ClaseService.createClase(claseData);
      
      alert('¡Clase programada exitosamente!');
      
      // Resetear formulario
      setFormulario({
        fecha: '',
        hora: '',
        duracion: 60,
        tema: '',
        descripcion: '',
        estudiantesSeleccionados: [],
        tipoClase: 'individual',
        modalidad: 'virtual',
        meetLink: ''
      });
      
    } catch (error) {
      console.error('Error al programar clase:', error);
      alert('Error al programar la clase. Intenta nuevamente.');
    }
  };

  const getEstudianteNombre = (id: string) => {
    return estudiantesDisponibles.find(e => e.id === id)?.nombre || '';
  };

  return (
    <div className="programar-clase">
      <div className="programar-header">
        <h2>Programar Nueva Clase</h2>
        <p>Crea una nueva clase y asigna estudiantes</p>
      </div>

      <form onSubmit={handleSubmit} className="clase-form">
        <div className="form-grid">
          {/* Información básica */}
          <div className="form-section">
            <h3>Información Básica</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha">Fecha</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formulario.fecha}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="hora">Hora</label>
                <input
                  type="time"
                  id="hora"
                  name="hora"
                  value={formulario.hora}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duracion">Duración (minutos)</label>
                <select
                  id="duracion"
                  name="duracion"
                  value={formulario.duracion}
                  onChange={handleInputChange}
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                  <option value={90}>90 minutos</option>
                  <option value={120}>120 minutos</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="modalidad">Modalidad</label>
                <select
                  id="modalidad"
                  name="modalidad"
                  value={formulario.modalidad}
                  onChange={handleInputChange}
                >
                  <option value="virtual">Virtual</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tema">Tema de la Clase</label>
              <select
                id="tema"
                name="tema"
                value={formulario.tema}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona un tema</option>
                {temasComunes.map(tema => (
                  <option key={tema} value={tema}>{tema}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formulario.descripcion}
                onChange={handleInputChange}
                placeholder="Describe los objetivos y contenido de la clase..."
                rows={4}
              />
            </div>

            {/* Google Meet Section */}
            {formulario.modalidad === 'virtual' && (
              <div className="form-group meet-section">
                <label>Enlace de Videoconferencia</label>
                <div className="meet-container">
                  {!formulario.meetLink ? (
                    <div className="meet-options">
                      <div className="meet-manual">
                        <label>Ingresa el enlace de la clase (Zoom, Meet, Teams, etc.):</label>
                        <input
                          type="url"
                          placeholder="https://tu-plataforma.com/tu-reunion"
                          onChange={(e) => setFormulario(prev => ({ ...prev, meetLink: e.target.value }))}
                          className="meet-input"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="meet-link-container">
                      <div className="meet-link">
                        <span className="meet-icon">📹</span>
                        <a href={formulario.meetLink} target="_blank" rel="noopener noreferrer">
                          {formulario.meetLink}
                        </a>
                      </div>
                      <button
                        type="button"
                        className="btn-regenerar-meet"
                        onClick={() => setFormulario(prev => ({ ...prev, meetLink: '' }))}
                      >
                        🔄 Cambiar
                      </button>
                    </div>
                  )}
                </div>
                <small className="meet-help">
                  💡 Tip: Pega aquí el enlace de la reunión que usarás (Zoom, Meet, Teams, etc.)
                </small>
              </div>
            )}
          </div>

          {/* Selección de estudiantes */}
          <div className="form-section">
            <h3>Estudiantes</h3>
            
            <div className="form-group">
              <label htmlFor="tipoClase">Tipo de Clase</label>
              <select
                id="tipoClase"
                name="tipoClase"
                value={formulario.tipoClase}
                onChange={handleInputChange}
              >
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
              </select>
            </div>

            <div className="estudiantes-selector">
              <div className="selector-header">
                <button
                  type="button"
                  className="toggle-estudiantes"
                  onClick={() => setMostrarEstudiantes(!mostrarEstudiantes)}
                >
                  {mostrarEstudiantes ? '▼' : '▶'} Seleccionar Estudiantes
                  {formulario.estudiantesSeleccionados.length > 0 && (
                    <span className="selected-count">
                      ({formulario.estudiantesSeleccionados.length} seleccionados)
                    </span>
                  )}
                </button>
              </div>

              {mostrarEstudiantes && (
                <div className="estudiantes-panel">
                  <div className="panel-header">
                    <select
                      value={filtroNivel}
                      onChange={(e) => setFiltroNivel(e.target.value)}
                      className="nivel-filter"
                    >
                      <option value="todos">Todos los niveles</option>
                      {nivelesDisponiblesOrdenados.map(nivel => (
                        <option key={nivel} value={nivel}>{nivel}</option>
                      ))}
                    </select>
                    
                    <button
                      type="button"
                      className="btn-seleccionar-todos"
                      onClick={toggleSeleccionarTodos}
                      disabled={estudiantesFiltrados.length === 0}
                    >
                      {seleccionarTodos ? '✓ Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>

                  <div className="estudiantes-list">
                    {cargandoEstudiantes ? (
                      <div className="loading-estudiantes">Cargando estudiantes...</div>
                    ) : estudiantesFiltrados.length === 0 ? (
                      <div className="no-estudiantes">No hay estudiantes disponibles para este filtro</div>
                    ) : (
                      estudiantesFiltrados.map(estudiante => (
                        <div
                          key={estudiante.id}
                          className={`estudiante-item ${
                            formulario.estudiantesSeleccionados.includes(estudiante.id) ? 'selected' : ''
                          }`}
                          onClick={() => toggleEstudiante(estudiante.id)}
                        >
                          <div className="estudiante-info">
                            <span className="estudiante-nombre">{estudiante.nombre}</span>
                            <span className="estudiante-nivel">{estudiante.nivel}</span>
                            <span className="estudiante-email">{estudiante.email}</span>
                          </div>
                          <div className="checkbox">
                            {formulario.estudiantesSeleccionados.includes(estudiante.id) ? '✓' : ''}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {formulario.estudiantesSeleccionados.length > 0 && (
                <div className="selected-students">
                  <h4>Estudiantes Seleccionados:</h4>
                  <div className="selected-tags">
                    {formulario.estudiantesSeleccionados.map(id => (
                      <span key={id} className="student-tag">
                        {getEstudianteNombre(id)}
                        <button
                          type="button"
                          onClick={() => toggleEstudiante(id)}
                          className="remove-student"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Programar Clase
          </button>
        </div>
      </form>
    </div>
  );
}
