import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { ClaseService } from '../../services/claseService';
import { authService } from '../../services/authService';
import { asistenciaService } from '../../services/asistenciaService';
import './EstudiantesView.css';

interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  nivel: string;
  fechaRegistro: string;
  clasesCompletadas: number;
  evaluacionesRealizadas: number;
  promedioGeneral: number;
  ultimaActividad: string;
  estado: 'activo' | 'inactivo';
}

interface ResultadoEvaluacion {
  evaluacionId: string;
  titulo: string;
  fecha: string;
  puntuacion: number;
  puntosTotales: number;
  porcentaje: number;
  respuestasCorrectas: number;
  totalPreguntas: number;
  tiempoEmpleado: string;
}

export default function EstudiantesView() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [asistenciasEstudiante, setAsistenciasEstudiante] = useState<any[]>([]);
  const [estadisticasAsistencia, setEstadisticasAsistencia] = useState<{[key: string]: any}>({});
  const [guardandoAsistencia, setGuardandoAsistencia] = useState<{[key: string]: boolean}>({});
  const [clasesDelProfesor, setClasesDelProfesor] = useState<any[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState<any>(null);
  const [asistenciasClaseActual, setAsistenciasClaseActual] = useState<{[key: string]: string}>({});
  const [asistenciasTemporal, setAsistenciasTemporal] = useState<{[key: string]: string}>({});
  const [guardandoTodasAsistencias, setGuardandoTodasAsistencias] = useState(false);

  // Cargar estudiantes reales del backend
  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    try {
      setCargando(true);
      
      // Obtener el usuario actual (profesor) desde localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('No se pudo obtener el usuario actual');
        setCargando(false);
        return;
      }
      const currentUser = JSON.parse(userStr);
      if (!currentUser || !currentUser.id) {
        console.error('Usuario inválido');
        setCargando(false);
        return;
      }
      
      // Obtener solo las clases del profesor actual desde el backend
      const todasLasClases = await ClaseService.getClasesPorProfesor(currentUser.id);
      
      // Filtrar solo clases activas para el profesor (programadas o en curso/en vivo)
      const clasesActivas = todasLasClases.filter((c: any) => 
        c.estado === 'programada' ||
        c.estado === 'activa' ||      // estado usado por el backend PHP/servicio de cambio de estado
        c.estado === 'en_curso'       // compatibilidad con posibles valores legacy
      );
      
      // Ordenar por fecha (más recientes primero)
      clasesActivas.sort((a: any, b: any) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });
      
      setClasesDelProfesor(clasesActivas);
      
      // Seleccionar automáticamente la clase de hoy si existe
      const hoy = new Date().toISOString().split('T')[0];
      const claseHoy = clasesActivas.find((c: any) => c.fecha === hoy);
      if (claseHoy) {
        setClaseSeleccionada(claseHoy);
        await cargarAsistenciasClase(claseHoy.id);
      }
      
      // Obtener todos los usuarios y quedarnos solo con los estudiantes
      const usuarios = await userService.getAll();
      const soloEstudiantes = usuarios.filter((u: any) => u.rol === 'student');

      // Si no hay estudiantes, mostrar lista vacía
      if (soloEstudiantes.length === 0) {
        setEstudiantes([]);
        setCargando(false);
        return;
      }

      // Construir la lista de estudiantes con estadísticas de asistencia
      const estudiantesData: Estudiante[] = await Promise.all(
        soloEstudiantes.map(async (u: any) => {
          // Obtener estadísticas de asistencia desde el servicio (actualmente contra el backend antiguo)
          const stats = await asistenciaService.getEstadisticasAsistencia(u.id);

          return {
            id: u.id.toString(),
            nombre: `${u.nombres} ${u.apellidos}`,
            email: u.correo_personal || u.correo,
            nivel: u.nivel || 'Sin nivel',
            fechaRegistro: u.date_joined || new Date().toISOString(),
            clasesCompletadas: stats.presentes, // Clases donde asistió
            evaluacionesRealizadas: 0, // TODO: Calcular desde evaluaciones
            promedioGeneral: 0, // TODO: Calcular desde evaluaciones
            ultimaActividad: new Date().toISOString(),
            estado: (u.is_active ? 'activo' : 'inactivo') as 'activo' | 'inactivo'
          };
        })
      );

      setEstudiantes(estudiantesData);
      
      // Cargar estadísticas de asistencia para cada estudiante
      const stats: {[key: string]: any} = {};
      for (const estudiante of estudiantesData) {
        const estadisticas = await asistenciaService.getEstadisticasAsistencia(Number(estudiante.id));
        stats[estudiante.id] = estadisticas;
      }
      setEstadisticasAsistencia(stats);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar asistencias de una clase específica
  const cargarAsistenciasClase = async (claseId: number) => {
    try {
      const asistencias = await asistenciaService.getAsistenciasPorClase(claseId);
      const asistenciasMap: {[key: string]: string} = {};
      
      asistencias.forEach((asistencia: any) => {
        asistenciasMap[asistencia.estudiante_id.toString()] = asistencia.estado;
      });
      
      setAsistenciasClaseActual(asistenciasMap);
      setAsistenciasTemporal(asistenciasMap); // Inicializar temporal con guardadas
    } catch (error) {
      console.error('Error cargando asistencias de clase:', error);
    }
  };

  // Manejar cambio de clase seleccionada
  const handleClaseChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const claseId = Number(event.target.value);
    const clase = clasesDelProfesor.find(c => c.id === claseId);
    
    if (clase) {
      setClaseSeleccionada(clase);
      setAsistenciasTemporal({}); // Limpiar temporal
      await cargarAsistenciasClase(clase.id);
    }
  };

  // Datos mock de evaluaciones del estudiante seleccionado
  const [resultadosEvaluaciones] = useState<ResultadoEvaluacion[]>([
    {
      evaluacionId: '1',
      titulo: 'Quiz de Vocabulario - Unidad 3',
      fecha: '2025-08-30',
      puntuacion: 17,
      puntosTotales: 20,
      porcentaje: 85,
      respuestasCorrectas: 8,
      totalPreguntas: 10,
      tiempoEmpleado: '12:34'
    },
    {
      evaluacionId: '2',
      titulo: 'Examen de Gramática Intermedia',
      fecha: '2025-08-25',
      puntuacion: 19,
      puntosTotales: 25,
      porcentaje: 76,
      respuestasCorrectas: 19,
      totalPreguntas: 25,
      tiempoEmpleado: '28:45'
    },
    {
      evaluacionId: '3',
      titulo: 'Quiz Rápido - Present Perfect',
      fecha: '2025-08-20',
      puntuacion: 15,
      puntosTotales: 16,
      porcentaje: 94,
      respuestasCorrectas: 7,
      totalPreguntas: 8,
      tiempoEmpleado: '8:12'
    }
  ]);

  const estudiantePerteneceAClaseSeleccionada = (estudiante: Estudiante) => {
    if (!claseSeleccionada) return true;
    const asignados = (claseSeleccionada as any).estudiantes;
    if (!asignados) return false;

    const estudianteIdNum = Number(estudiante.id);

    if (Array.isArray(asignados)) {
      return asignados.includes(estudianteIdNum);
    }

    if (typeof asignados === 'string') {
      try {
        const ids = asignados
          .split(',')
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id: number) => !isNaN(id));
        return ids.includes(estudianteIdNum);
      } catch {
        return false;
      }
    }

    return false;
  };

  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    const cumpleClase = estudiantePerteneceAClaseSeleccionada(estudiante);
    const cumpleFiltroNivel = filtroNivel === 'todos' || estudiante.nivel.toLowerCase() === filtroNivel.toLowerCase();
    const cumpleFiltroEstado = filtroEstado === 'todos' || estudiante.estado === filtroEstado;
    return cumpleClase && cumpleFiltroNivel && cumpleFiltroEstado;
  });

  const verDetallesEstudiante = async (estudiante: Estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setMostrarDetalles(true);
    
    // Cargar historial de asistencia del estudiante
    await cargarAsistenciasEstudiante(estudiante.id);
  };

  const cargarAsistenciasEstudiante = async (estudianteId: string) => {
    try {
      // Obtener solo las clases del profesor actual
      const userStr = localStorage.getItem('user');
      let todasLasClases: any[] = [];
      if (userStr) {
        try {
          const currentUser = JSON.parse(userStr);
          todasLasClases = await ClaseService.getClasesPorProfesor(currentUser.id);
        } catch (e) {
          console.error('Error parseando usuario en cargarAsistenciasEstudiante:', e);
          todasLasClases = [];
        }
      }
      
      // Filtrar clases (del profesor) donde el estudiante está asignado
      const clasesDelEstudiante = todasLasClases.filter((clase: any) => {
        return clase.estudiantes && clase.estudiantes.includes(parseInt(estudianteId));
      });
      
      // Cargar asistencia de cada clase
      const asistencias = clasesDelEstudiante.map((clase: any) => {
        const asistenciaKey = `asistencia_clase_${clase.id}`;
        const asistenciaGuardada = localStorage.getItem(asistenciaKey);
        let asistio = null;
        
        if (asistenciaGuardada) {
          const asistencias = JSON.parse(asistenciaGuardada);
          asistio = asistencias[estudianteId];
        }
        
        return {
          claseId: clase.id,
          tema: clase.tema || clase.nombre,
          fecha: clase.fecha,
          profesor: clase.profesor,
          asistio: asistio
        };
      });
      
      setAsistenciasEstudiante(asistencias);
      console.log('Asistencias del estudiante:', asistencias);
    } catch (error) {
      console.error('Error cargando asistencias:', error);
    }
  };

  const cerrarDetalles = () => {
    setMostrarDetalles(false);
    setEstudianteSeleccionado(null);
  };

  // Manejar cambio de asistencia (solo actualiza estado temporal)
  const handleAsistenciaChange = (estudianteId: string, estado: 'presente' | 'ausente') => {
    if (!claseSeleccionada) {
      alert('Por favor selecciona una clase antes de marcar asistencia');
      return;
    }
    
    setAsistenciasTemporal(prev => ({
      ...prev,
      [estudianteId]: estado
    }));
  };

  // Guardar todas las asistencias de la clase
  const guardarTodasAsistencias = async () => {
    try {
      if (!claseSeleccionada) {
        alert('Por favor selecciona una clase');
        return;
      }

      // Validar que haya al menos una asistencia marcada
      if (Object.keys(asistenciasTemporal).length === 0) {
        alert('Por favor marca al menos una asistencia antes de guardar');
        return;
      }

      setGuardandoTodasAsistencias(true);

      // Guardar cada asistencia
      const promesas = Object.entries(asistenciasTemporal).map(([estudianteId, estado]) => 
        asistenciaService.registrarAsistencia({
          estudiante_id: Number(estudianteId),
          clase_id: claseSeleccionada.id,
          fecha: claseSeleccionada.fecha,
          estado: estado as 'presente' | 'ausente'
        })
      );

      await Promise.all(promesas);

      // Actualizar asistencias guardadas
      setAsistenciasClaseActual(asistenciasTemporal);

      // Recargar estadísticas de todos los estudiantes
      const stats: {[key: string]: any} = {};
      for (const estudiante of estudiantes) {
        const estadisticas = await asistenciaService.getEstadisticasAsistencia(Number(estudiante.id));
        stats[estudiante.id] = estadisticas;
      }
      setEstadisticasAsistencia(stats);

      // Actualizar contadores en la tabla
      setEstudiantes(prev => prev.map(est => ({
        ...est,
        clasesCompletadas: stats[est.id]?.presentes || 0
      })));

      alert('✅ Asistencia guardada correctamente');
      console.log(`Asistencias guardadas para clase: ${claseSeleccionada.nombre} (${claseSeleccionada.fecha})`);
    } catch (error) {
      console.error('Error guardando asistencias:', error);
      alert('❌ Error al guardar las asistencias. Por favor intenta de nuevo.');
    } finally {
      setGuardandoTodasAsistencias(false);
    }
  };

  const getPromedioColor = (promedio: number) => {
    if (promedio >= 90) return '#10b981';
    if (promedio >= 80) return '#f59e0b';
    if (promedio >= 70) return '#ef4444';
    return '#6b7280';
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case 'básico': return '#3b82f6';
      case 'intermedio': return '#f59e0b';
      case 'avanzado': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="estudiantes-view">
      <div className="estudiantes-header">
        <div className="header-info">
          <h2>Mis Estudiantes</h2>
          <p>Gestiona y revisa el progreso de tus estudiantes</p>
        </div>
        
        <div className="header-filters">
          <select 
            value={claseSeleccionada?.id || ''} 
            onChange={handleClaseChange}
            className="filter-select clase-selector"
          >
            <option value="">Selecciona una clase</option>
            {clasesDelProfesor.map((clase: any) => (
              <option key={clase.id} value={clase.id}>
                {clase.nombre} - {new Date(clase.fecha + 'T12:00:00').toLocaleDateString('es-ES')} - {clase.hora}
              </option>
            ))}
          </select>
          
          <select 
            value={filtroNivel} 
            onChange={(e) => setFiltroNivel(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los niveles</option>
            <option value="básico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
          
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          
          <button 
            className="btn-guardar-asistencia"
            onClick={guardarTodasAsistencias}
            disabled={!claseSeleccionada || guardandoTodasAsistencias || Object.keys(asistenciasTemporal).length === 0}
          >
            {guardandoTodasAsistencias ? '⏳ Guardando...' : '💾 Guardar Asistencia'}
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="cargando-estudiantes">
          <div className="spinner"></div>
          <p>Cargando estudiantes...</p>
        </div>
      ) : (
        <div className="estudiantes-table-container">
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Correo</th>
                  <th>Nivel</th>
                  <th>Clases Asistidas</th>
                  <th>Evaluaciones</th>
                  <th>Promedio</th>
                  <th>Estado</th>
                  <th>Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map((estudiante) => {
                  const [nombre, ...apellidos] = estudiante.nombre.split(' ');
                  const apellido = apellidos.join(' ');
                  return (
                    <tr key={estudiante.id}>
                      <td>{nombre}</td>
                      <td>{apellido}</td>
                      <td>{estudiante.email}</td>
                      <td>
                        <span 
                          className="nivel-badge-table"
                          style={{ backgroundColor: getNivelColor(estudiante.nivel) }}
                        >
                          {estudiante.nivel}
                        </span>
                      </td>
                      <td className="text-center">{estudiante.clasesCompletadas}</td>
                      <td className="text-center">{estudiante.evaluacionesRealizadas}</td>
                      <td className="text-center">
                        <span 
                          className="promedio-badge"
                          style={{ color: getPromedioColor(estudiante.promedioGeneral) }}
                        >
                          {estudiante.promedioGeneral}%
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`estado-badge ${estudiante.estado}`}>
                          {estudiante.estado === 'activo' ? '🟢 Activo' : '🔴 Inactivo'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="asistencia-controls">
                          <label className="asistencia-option">
                            <input 
                              type="radio" 
                              name={`asistencia-${estudiante.id}`}
                              value="presente"
                              checked={asistenciasTemporal[estudiante.id] === 'presente'}
                              onChange={() => handleAsistenciaChange(estudiante.id, 'presente')}
                              disabled={guardandoTodasAsistencias || !claseSeleccionada}
                            />
                            <span className="asistencia-label presente">
                              ✓ Presente
                              {asistenciasClaseActual[estudiante.id] === 'presente' && asistenciasTemporal[estudiante.id] === 'presente' && ' ✅'}
                            </span>
                          </label>
                          <label className="asistencia-option">
                            <input 
                              type="radio" 
                              name={`asistencia-${estudiante.id}`}
                              value="ausente"
                              checked={asistenciasTemporal[estudiante.id] === 'ausente'}
                              onChange={() => handleAsistenciaChange(estudiante.id, 'ausente')}
                              disabled={guardandoTodasAsistencias || !claseSeleccionada}
                            />
                            <span className="asistencia-label ausente">
                              ✗ Ausente
                              {asistenciasClaseActual[estudiante.id] === 'ausente' && asistenciasTemporal[estudiante.id] === 'ausente' && ' ✅'}
                            </span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!cargando && estudiantesFiltrados.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No hay estudiantes</h3>
          <p>No tienes estudiantes que coincidan con los filtros seleccionados.</p>
        </div>
      )}

      {/* Modal de detalles del estudiante */}
      {mostrarDetalles && estudianteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarDetalles}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="estudiante-modal-info">
                <div className="modal-avatar">
                  {estudianteSeleccionado.nombre.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2>{estudianteSeleccionado.nombre}</h2>
                  <p>{estudianteSeleccionado.email}</p>
                </div>
              </div>
              <button className="close-btn" onClick={cerrarDetalles}>✕</button>
            </div>

            <div className="modal-body">
              <div className="resumen-estudiante">
                <div className="resumen-stats">
                  <div className="resumen-stat">
                    <span className="resumen-numero">{estudianteSeleccionado.clasesCompletadas}</span>
                    <span className="resumen-label">Clases Completadas</span>
                  </div>
                  <div className="resumen-stat">
                    <span className="resumen-numero">{estudianteSeleccionado.evaluacionesRealizadas}</span>
                    <span className="resumen-label">Evaluaciones</span>
                  </div>
                  <div className="resumen-stat">
                    <span 
                      className="resumen-numero"
                      style={{ color: getPromedioColor(estudianteSeleccionado.promedioGeneral) }}
                    >
                      {estudianteSeleccionado.promedioGeneral}%
                    </span>
                    <span className="resumen-label">Promedio</span>
                  </div>
                </div>
              </div>

              {/* Historial de Asistencias */}
              <div className="asistencias-detalle">
                <h3>📋 Historial de Asistencias</h3>
                {asistenciasEstudiante.length === 0 ? (
                  <div className="sin-asistencias">
                    <p>No hay registros de asistencia para este estudiante</p>
                  </div>
                ) : (
                  <div className="asistencias-lista">
                    {asistenciasEstudiante.map((asistencia, index) => (
                      <div key={index} className="asistencia-item">
                        <div className="asistencia-header">
                          <h4>{asistencia.tema}</h4>
                          <span className="asistencia-fecha">{formatFecha(asistencia.fecha)}</span>
                        </div>
                        <div className="asistencia-info">
                          <span className="asistencia-profesor">Profesor: {asistencia.profesor}</span>
                          <span className={`asistencia-estado ${
                            asistencia.asistio === true ? 'presente' : 
                            asistencia.asistio === false ? 'ausente' : 'sin-marcar'
                          }`}>
                            {asistencia.asistio === true ? '✅ Presente' : 
                             asistencia.asistio === false ? '❌ Ausente' : 
                             '⏳ Sin marcar'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="evaluaciones-detalle">
                <h3>Historial de Evaluaciones</h3>
                <div className="evaluaciones-lista">
                  {resultadosEvaluaciones.map((resultado) => (
                    <div key={resultado.evaluacionId} className="evaluacion-resultado">
                      <div className="resultado-header">
                        <h4>{resultado.titulo}</h4>
                        <span className="resultado-fecha">{formatFecha(resultado.fecha)}</span>
                      </div>
                      
                      <div className="resultado-stats">
                        <div className="resultado-puntuacion">
                          <span className="puntuacion-label">Puntuación:</span>
                          <span className="puntuacion-valor">
                            {resultado.puntuacion}/{resultado.puntosTotales} pts ({resultado.porcentaje}%)
                          </span>
                        </div>
                        
                        <div className="resultado-respuestas">
                          <span className="respuestas-label">Respuestas:</span>
                          <span className="respuestas-valor">
                            {resultado.respuestasCorrectas}/{resultado.totalPreguntas} correctas
                          </span>
                        </div>
                        
                        <div className="resultado-tiempo">
                          <span className="tiempo-label">Tiempo:</span>
                          <span className="tiempo-valor">{resultado.tiempoEmpleado}</span>
                        </div>
                      </div>
                      
                      <div className="resultado-barra">
                        <div 
                          className="barra-progreso"
                          style={{ width: `${resultado.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
