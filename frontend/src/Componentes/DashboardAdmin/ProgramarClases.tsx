/**
 * @file ProgramarClases.jsx
 * @brief Componente para la gestión de clases (crear, leer, actualizar, eliminar).
 * @author [Tu Nombre]
 * @version 1.0
 * @date [Fecha]
 */
import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSpinner } from 'react-icons/fa';
import { ClaseService } from '../../services/claseService';
import { userService } from '../../services/userService';
import './ProgramarClases.css';

/**
 * @component ProgramarClases
 * @brief Componente principal que renderiza la interfaz de gestión de clases.
 * 
 * Maneja el estado de las clases, la visualización del formulario y las
 * operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para las clases.
 * 
 * @returns {JSX.Element} El componente de gestión de clases.
 */

interface Clase {
  id: number;
  nombre: string;
  profesor: string;
  fecha: string;
  estudiantes?: string[];
}

interface FormData {
  nombre: string;
  profesor: string;
  fecha: string;
  hora: string;
  estudiantes: string[];
  meet_link?: string;
}

interface FormErrors {
  nombre?: string;
  profesor?: string;
  fecha?: string;
  hora?: string;
  estudiantes?: string;
}

interface EstudianteDisponible {
  id: string;
  nombre: string;
  nivel: string;
  email: string;
  bloque?: string;
}

const ITEMS_PER_PAGE = 20;

export default function ProgramarClases() {
  /**
   * @state {Array<Object>} clases - Lista de todas las clases.
   */
  const [clases, setClases] = useState<Clase[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);

  /**
   * @state {boolean} showForm - Controla la visibilidad del formulario de creación/edición.
   */
  const [showForm, setShowForm] = useState<boolean>(false);

  /**
   * @state {Object|null} editingClass - Almacena la clase que se está editando. Null si se crea una nueva.
   */
  const [editingClass, setEditingClass] = useState<Clase | null>(null);

  /**
   * @state {boolean} isLoading - Indica si una operación asíncrona está en curso.
   */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * @state {Object} formData - Almacena los datos del formulario para una clase.
   */
  const [formData, setFormData] = useState<FormData>({ nombre: '', profesor: '', fecha: '', hora: '', estudiantes: [] });

  /**
   * @state {Object} formErrors - Almacena los errores de validación del formulario.
   */
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  /**
   * @state {Array<EstudianteDisponible>} estudiantesDisponibles - Lista de estudiantes disponibles.
   */
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState<EstudianteDisponible[]>([]);

  /**
   * @state {boolean} cargandoEstudiantes - Indica si se están cargando los estudiantes.
   */
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState<boolean>(true);

  /**
   * @state {Array} profesoresDisponibles - Lista de profesores disponibles.
   */
  const [profesoresDisponibles, setProfesoresDisponibles] = useState<any[]>([]);

  /**
   * @state {string} filtroNivel - Filtro por nivel/bloque.
   */
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');

  /**
   * @state {boolean} seleccionarTodos - Estado para seleccionar/deseleccionar todos.
   */
  const [seleccionarTodos, setSeleccionarTodos] = useState<boolean>(false);

  /**
   * @function validateForm
   * @brief Valida los datos del formulario antes de enviarlo.
   * @returns {Object} Un objeto que contiene los mensajes de error.
   */
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre de la clase es obligatorio';
    if (!formData.profesor.trim()) errors.profesor = 'El nombre del profesor es obligatorio';
    if (!formData.fecha) errors.fecha = 'La fecha es obligatoria';
    if (!formData.hora) errors.hora = 'La hora es obligatoria';
    if (!formData.estudiantes || formData.estudiantes.length === 0) errors.estudiantes = 'Debes seleccionar al menos un estudiante';
    return errors;
  };

  /**
   * @function handleChange
   * @brief Maneja los cambios en los campos del formulario y actualiza el estado.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - El evento del cambio.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * @function handleEstudiantesChange
   * @brief Maneja los cambios en la selección de estudiantes.
   * @param {string} id - El ID del estudiante.
   */
  const handleEstudiantesChange = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      estudiantes: prev.estudiantes.includes(id)
        ? prev.estudiantes.filter(eid => eid !== id)
        : [...prev.estudiantes, id]
    }));
    if (formErrors.estudiantes) {
      setFormErrors((prev) => ({ ...prev, estudiantes: '' }));
    }
  };

  /**
   * @function toggleSeleccionarTodos
   * @brief Selecciona o deselecciona todos los estudiantes filtrados.
   */
  const toggleSeleccionarTodos = () => {
    const estudiantesFiltradosIds = estudiantesFiltrados.map(e => e.id);
    if (seleccionarTodos) {
      // Deseleccionar todos los filtrados
      setFormData(prev => ({
        ...prev,
        estudiantes: prev.estudiantes.filter(id => 
          !estudiantesFiltradosIds.includes(id)
        )
      }));
    } else {
      // Seleccionar todos los filtrados
      setFormData(prev => ({
        ...prev,
        estudiantes: [...new Set([...prev.estudiantes, ...estudiantesFiltradosIds])]
      }));
    }
    setSeleccionarTodos(!seleccionarTodos);
  };

  /**
   * @function estudiantesFiltrados
   * @brief Filtra los estudiantes según el nivel seleccionado.
   */
  const estudiantesFiltrados = estudiantesDisponibles.filter(estudiante => {
    if (filtroNivel === 'todos') return true;
    
    // Filtrar por nivel específico (A1, A2, B1, B2, C1, C2)
    if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(filtroNivel)) {
      return estudiante.nivel === filtroNivel;
    }
    
    // Filtros legacy para compatibilidad
    return estudiante.nivel.toLowerCase() === filtroNivel.toLowerCase();
  });

  /**
   * @function handleAddClassClick
   * @brief Muestra el formulario para agregar una nueva clase.
   */
  const handleAddClassClick = () => {
    setShowForm(true);
    setEditingClass(null);
    setFormData({ nombre: '', profesor: '', fecha: '', hora: '', estudiantes: [], meet_link: '' });
    setFormErrors({});
  };

  /**
   * @function handleEditClass
   * @brief Carga los datos de una clase en el formulario para su edición.
   * @param {Object} clase - La clase a editar.
   */
  const handleEditClass = (clase: Clase) => {
    setShowForm(true);
    setEditingClass(clase);
    setFormData({
      nombre: clase.nombre,
      profesor: clase.profesor,
      fecha: clase.fecha,
      hora: '',
      estudiantes: clase.estudiantes || [],
      meet_link: ''
    });
    setFormErrors({});
  };

  /**
   * @function handleDeleteClass
   * @brief Elimina una clase de la lista.
   * @param {number} classId - El ID de la clase a eliminar.
   */
  const handleDeleteClass = async (classId: number) => {
    setIsLoading(true);
    try {
      await ClaseService.deleteClase(classId);
      const data = await ClaseService.getClases();
      setClases(data);
      setPaginaActual(1);
    } catch (err) {
      // Puedes mostrar un error aquí si lo deseas
    }
    setIsLoading(false);
  };

  /**
   * @function generateMeetLink
   * @brief Genera un enlace de Google Meet real y funcional.
   * @returns {string} El enlace de Google Meet generado.
   */
  const generateMeetLink = (): string => {
    return formData.meet_link || '';
  };

  /**
   * @function generarEnlaceMeetAsync
   * @brief Genera un enlace de Meet de forma asíncrona con simulación de carga.
   */
  const generarEnlaceMeetAsync = async () => {
    setIsLoading(true);
    try {
      // Simular tiempo de generación para UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const nuevoEnlace = generateMeetLink();
      setFormData(prev => ({ ...prev, meet_link: nuevoEnlace }));
    } catch (error) {
      console.error('Error generando enlace de Meet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function handleSubmit
   * @brief Maneja el envío del formulario para crear o actualizar una clase.
   * @param {React.FormEvent<HTMLFormElement>} e - El evento de envío del formulario.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsLoading(true);
    try {
      // Generar enlace de Meet automáticamente si no existe
      const dataToSend = {
        ...formData,
        meet_link: generateMeetLink(),
        estado: 'programada' // Asegurar que las clases nuevas se creen como programadas
      };
      
      if (editingClass) {
        await ClaseService.updateClase(editingClass.id, dataToSend);
      } else {
        await ClaseService.createClase(dataToSend);
      }
      const data = await ClaseService.getClases();
      setClases(data);
      setPaginaActual(1);
      setShowForm(false);
      setEditingClass(null);
      setFormErrors({});
    } catch (err) {
      // Puedes mostrar un error aquí si lo deseas
    }
    setIsLoading(false);
  };

  /**
   * @function handleCancel
   * @brief Cancela la operación de edición o creación y oculta el formulario.
   */
  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormErrors({});
  };

  // Cargar estudiantes reales de la base de datos
  useEffect(() => {
    const cargarEstudiantes = async () => {
      setCargandoEstudiantes(true);
      try {
        const usuarios = await userService.getAll();
        
        // Filtrar estudiantes
        const estudiantes = usuarios
          .filter(usuario => usuario.rol === 'student' && usuario.activo)
          .map(usuario => {
            return {
              id: usuario.id.toString(),
              nombre: `${usuario.nombres} ${usuario.apellidos}`,
              nivel: usuario.nivel || 'Sin nivel',
              email: usuario.correo,
              bloque: usuario.nivel ? `Nivel ${usuario.nivel}` : 'Sin nivel'
            };
          });
        
        // Filtrar profesores
        const profesores = usuarios
          .filter(usuario => usuario.rol === 'profesor' && usuario.activo)
          .map(usuario => ({
            id: usuario.id.toString(),
            nombre: `${usuario.nombres} ${usuario.apellidos}`,
            email: usuario.correo
          }));
        
        setEstudiantesDisponibles(estudiantes);
        setProfesoresDisponibles(profesores);
      } catch (error) {
        console.error('Error cargando estudiantes y profesores:', error);
      } finally {
        setCargandoEstudiantes(false);
      }
    };

    cargarEstudiantes();
  }, []);

  // Cargar clases desde el backend al montar el componente
  useEffect(() => {
    const fetchClases = async () => {
      setIsLoading(true);
      try {
        const data = await ClaseService.getClases();
        setClases(data);
        setPaginaActual(1);
      } catch (err) {
        // Puedes mostrar un error aquí si lo deseas
      }
      setIsLoading(false);
    };
    fetchClases();
  }, []);

  const totalClases = clases.length;
  const totalPaginas = Math.max(1, Math.ceil(totalClases / ITEMS_PER_PAGE));
  const paginaActualSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaActualSegura - 1) * ITEMS_PER_PAGE;
  const clasesPagina = clases.slice(indiceInicio, indiceInicio + ITEMS_PER_PAGE);
  const pageNumbers = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  const irAPagina = (pagina: number) => {
    const nuevaPagina = Math.max(1, Math.min(pagina, totalPaginas));
    setPaginaActual(nuevaPagina);
  };

  const irPrimera = () => irAPagina(1);
  const irUltima = () => irAPagina(totalPaginas);
  const irAnterior = () => irAPagina(paginaActualSegura - 1);
  const irSiguiente = () => irAPagina(paginaActualSegura + 1);

  return (
    <div className="gestion-container">
      <div className="dashboard-header">
        <h2>Gestión de Clases</h2>
        <p>Crea, edita y administra las clases programadas.</p>
      </div>

      {!showForm && (
        <button 
          onClick={handleAddClassClick} 
          className="add-user-btn"
          disabled={isLoading}
        >
          <FaPlus />
          Agregar Clase
        </button>
      )}

      {showForm && (
        <div className="form-container">
          <h3>{editingClass ? 'Editar Clase' : 'Agregar Nueva Clase'}</h3>
          <form onSubmit={handleSubmit} noValidate>
            <div className={`form-group ${formErrors.nombre ? 'error' : ''}`}>
              <label htmlFor="nombre">Nombre de la Clase *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Introduccion C1"
                required
              />
              {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
            </div>

            <div className={`form-group ${formErrors.profesor ? 'error' : ''}`}>
              <label htmlFor="profesor">Nombre del Profesor *</label>
              <select
                id="profesor"
                name="profesor"
                value={formData.profesor}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Selecciona un profesor</option>
                {profesoresDisponibles.map(profesor => (
                  <option key={profesor.id} value={profesor.nombre}>
                    {profesor.nombre}
                  </option>
                ))}
              </select>
              {formErrors.profesor && <span className="error-message">{formErrors.profesor}</span>}
            </div>

            <div className={`form-group ${formErrors.fecha ? 'error' : ''}`}>
              <label htmlFor="fecha">Fecha de la Clase *</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
              {formErrors.fecha && <span className="error-message">{formErrors.fecha}</span>}
            </div>

            <div className={`form-group ${formErrors.hora ? 'error' : ''}`}>
              <label htmlFor="hora">Hora de la Clase *</label>
              <input
                type="time"
                id="hora"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                required
              />
              {formErrors.hora && <span className="error-message">{formErrors.hora}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="meet_link">Enlace de Videoconferencia</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="url"
                  id="meet_link"
                  name="meet_link"
                  value={formData.meet_link || ''}
                  onChange={handleChange}
                  placeholder="https://tu-plataforma.com/tu-reunion"
                  style={{ flex: 1 }}
                />
              </div>
              <small style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '5px', display: 'block' }}>
                💡 Pega aquí el enlace de la reunión que usarás (Zoom, Meet, Teams, etc.)
              </small>
            </div>

            <div className={`form-group ${formErrors.estudiantes ? 'error' : ''}`}>
              <label>Selecciona Estudiantes *</label>
              
              {/* Filtros y controles */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                <select
                  value={filtroNivel}
                  onChange={(e) => setFiltroNivel(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="todos">Todos los niveles</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                  <option value="Sin nivel">Sin nivel</option>
                </select>
                
                <button
                  type="button"
                  onClick={toggleSeleccionarTodos}
                  disabled={estudiantesFiltrados.length === 0}
                  style={{
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: estudiantesFiltrados.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: estudiantesFiltrados.length === 0 ? 0.5 : 1
                  }}
                >
                  {seleccionarTodos ? '✓ Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              {/* Lista de estudiantes */}
              <div className="estudiantes-container">
                {cargandoEstudiantes ? (
                  <div className="loading-message">
                    <div className="spinner"></div>
                    Cargando estudiantes...
                  </div>
                ) : estudiantesFiltrados.length === 0 ? (
                  <div className="empty-message">
                    No hay estudiantes disponibles para este filtro
                  </div>
                ) : (
                  <div className="estudiantes-grid">
                    {estudiantesFiltrados.map((estudiante) => (
                      <div 
                        key={estudiante.id} 
                        className={`estudiante-card ${formData.estudiantes.includes(estudiante.id) ? 'selected' : ''}`}
                        onClick={() => handleEstudiantesChange(estudiante.id)}
                      >
                        <div className="estudiante-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.estudiantes.includes(estudiante.id)}
                            onChange={() => handleEstudiantesChange(estudiante.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="estudiante-info">
                          <div className="estudiante-nombre">{estudiante.nombre}</div>
                          <div className="estudiante-bloque">{estudiante.bloque}</div>
                          <div className="estudiante-email">{estudiante.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formErrors.estudiantes && <span className="error-message">{formErrors.estudiantes}</span>}
            </div>

            <div className="button-group">
              <button type="submit" className="form-submit-btn" disabled={isLoading}>
                {isLoading ? <FaSpinner className="loading-spinner" /> : (editingClass ? 'Guardar Cambios' : 'Agregar Clase')}
              </button>
              <button type="button" className="form-cancel-btn" onClick={handleCancel} disabled={isLoading}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="list-container">
          <h3>Lista de Clases</h3>
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre de la Clase</th>
                <th>Profesor</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clasesPagina.map((clase) => (
                <tr key={clase.id}>
                  <td>{clase.id}</td>
                  <td>{clase.nombre}</td>
                  <td>{clase.profesor}</td>
                  <td>{clase.fecha}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleEditClass(clase)} className="action-btn edit-btn" disabled={isLoading}>
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteClass(clase.id)} className="action-btn delete-btn" disabled={isLoading}>
                      {isLoading ? <FaSpinner className="loading-spinner" /> : <FaTrash />}
                    </button>
                  </td>
                </tr>
              ))}
              {clases.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay clases registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {clases.length > 0 && (
            <div className="paginacion-registros">
              <span className="paginacion-info">
                Mostrando {indiceInicio + 1}
                –{Math.min(indiceInicio + ITEMS_PER_PAGE, totalClases)} de {totalClases}
              </span>
              <div className="paginacion-botones">
                <button onClick={irPrimera} disabled={paginaActualSegura === 1}>
                  « Primero
                </button>
                <button onClick={irAnterior} disabled={paginaActualSegura === 1}>
                  ‹ Anterior
                </button>
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => irAPagina(num)}
                    className={num === paginaActualSegura ? 'pagina-activa' : ''}
                  >
                    {num}
                  </button>
                ))}
                <button onClick={irSiguiente} disabled={paginaActualSegura === totalPaginas}>
                  Siguiente ›
                </button>
                <button onClick={irUltima} disabled={paginaActualSegura === totalPaginas}>
                  Último »
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
