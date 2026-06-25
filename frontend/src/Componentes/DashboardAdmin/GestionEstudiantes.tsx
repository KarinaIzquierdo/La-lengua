import { useState, useEffect } from 'react';
import './GestionEstudiantes.css';
import { userService } from '../../services/userService';
import ModalEliminarEstudiante from './ModalEliminarEstudiante';
import type { EliminacionData } from './ModalEliminarEstudiante';

const ITEMS_PER_PAGE = 20;
interface Student {
  id: number;
  nombres: string;
  apellidos: string;
  correo?: string;
  correo_personal?: string;
  bloque_asignado: string;
  nivel?: string;
  especializacion?: string;
  is_active: boolean;
  date_joined: string;
}

interface EditForm {
  nombres: string;
  apellidos: string;
  correo_personal: string;
  nivel: string;
}

const GestionEstudiantes = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    nombres: '',
    apellidos: '',
    correo_personal: '',
    nivel: 'A1'
  });

  // Cargar estudiantes del backend
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      console.log('Datos de usuarios:', data);
      // Filtrar solo estudiantes (excluir admin, teacher, profesor)
      const estudiantesOnly = data.filter((u: any) => 
        u.rol === 'student' || u.rol === 'estudiante'
      );
      console.log('Estudiantes filtrados:', estudiantesOnly);
      console.log('Especializaciones:', estudiantesOnly.map((e: any) => ({ id: e.id, esp: e.especializacion })));
      setStudents(estudiantesOnly);
      setFilteredStudents(estudiantesOnly);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = students;

    // Filtro de búsqueda por nombre o email
    if (searchTerm) {
      filtered = filtered.filter(s => 
        `${s.nombres} ${s.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.correo_personal?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por nivel
    if (filterNivel) {
      filtered = filtered.filter(s => s.nivel === filterNivel);
    }

    setFilteredStudents(filtered);
    setPaginaActual(1);
  }, [searchTerm, filterNivel, students]);

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setEditForm({
      nombres: student.nombres || '',
      apellidos: student.apellidos || '',
      correo_personal: student.correo_personal || '',
      nivel: student.nivel || 'A1'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent) return;
    try {
      // Mapear nivel a english_level para el backend
      const dataToSend = {
        first_name: editForm.nombres,
        last_name: editForm.apellidos,
        correo_personal: editForm.correo_personal,
        english_level: editForm.nivel
      };
      await userService.update(selectedStudent.id, dataToSend);
      setShowEditModal(false);
      loadStudents();
      alert('Estudiante actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando estudiante:', error);
      alert('Error al actualizar estudiante');
    }
  };

  const handleDelete = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (data: EliminacionData) => {
    if (!studentToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://lalenguacolombia.co/api/index.php/users/${studentToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        alert('Estudiante eliminado correctamente. Se ha creado un registro de eliminación.');
        loadStudents();
        setShowDeleteModal(false);
        setStudentToDelete(null);
      } else {
        alert('Error al eliminar estudiante: ' + result.message);
      }
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      alert('Error al eliminar estudiante');
    }
  };

  const getNivelColor = (nivel?: string) => {
    const colors: any = {
      'A1': '#10b981',
      'A2': '#3b82f6',
      'B1': '#f59e0b',
      'B2': '#ef4444',
      'C1': '#8b5cf6',
      'C2': '#ec4899'
    };
    return colors[nivel || 'A1'] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const totalStudents = filteredStudents.length;
  const totalPaginas = Math.max(1, Math.ceil(totalStudents / ITEMS_PER_PAGE));
  const paginaActualSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaActualSegura - 1) * ITEMS_PER_PAGE;
  const studentsPagina = filteredStudents.slice(indiceInicio, indiceInicio + ITEMS_PER_PAGE);
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
    <div className="student-management-container">
      <div className="header-section">
        <h2>Gestión de Estudiantes</h2>
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-value">{students.length}</span>
            <span className="stat-label">Total Estudiantes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{students.filter(s => s.is_active).length}</span>
            <span className="stat-label">Activos</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{students.filter(s => !s.is_active).length}</span>
            <span className="stat-label">Inactivos</span>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los niveles</option>
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
        {(searchTerm || filterNivel) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterNivel('');
            }}
            className="clear-filters-btn"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de estudiantes */}
      {loading ? (
        <div className="loading-message">Cargando estudiantes...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="no-data-message">No se encontraron estudiantes</div>
      ) : (
        <div className="table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Nivel</th>
                <th>Especialización</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {studentsPagina.map((student) => (
                <tr key={student.id}>
                  <td className="student-name">
                    {student.nombres} {student.apellidos}
                  </td>
                  <td>{student.correo_personal || 'N/A'}</td>
                  <td>
                    <span 
                      className="nivel-badge"
                      style={{ backgroundColor: getNivelColor(student.nivel) }}
                    >
                      {student.nivel || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="especializacion-badge">
                      {student.especializacion || 'Sin asignar'}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${student.is_active ? 'activo' : 'inactivo'}`}>
                      {student.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{formatDate(student.date_joined)}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewDetails(student)}
                      className="action-btn view-btn"
                      title="Ver detalles"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleEdit(student)}
                      className="action-btn edit-btn"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
                      className="action-btn delete-btn"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalStudents > 0 && (
            <div className="paginacion-registros">
              <span className="paginacion-info">
                Mostrando {indiceInicio + 1}
                –{Math.min(indiceInicio + ITEMS_PER_PAGE, totalStudents)} de {totalStudents}
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

      {/* Modal de Detalles */}
      {showDetailsModal && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles del Estudiante</h3>
              <button onClick={() => setShowDetailsModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Nombre completo:</span>
                <span className="detail-value">{selectedStudent.nombres} {selectedStudent.apellidos}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedStudent.correo_personal || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Nivel de inglés:</span>
                <span className="detail-value">{selectedStudent.nivel || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Estado:</span>
                <span className="detail-value">{selectedStudent.is_active ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fecha de registro:</span>
                <span className="detail-value">{formatDate(selectedStudent.date_joined)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{selectedStudent.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Estudiante</h3>
              <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombres:</label>
                <input
                  type="text"
                  value={editForm.nombres}
                  onChange={(e) => setEditForm({...editForm, nombres: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Apellidos:</label>
                <input
                  type="text"
                  value={editForm.apellidos}
                  onChange={(e) => setEditForm({...editForm, apellidos: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editForm.correo_personal}
                  onChange={(e) => setEditForm({...editForm, correo_personal: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Nivel de inglés:</label>
                <select
                  value={editForm.nivel}
                  onChange={(e) => setEditForm({...editForm, nivel: e.target.value})}
                  className="form-input"
                >
                  <option value="">Sin nivel</option>
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
              <div className="modal-actions">
                <button onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} className="btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && studentToDelete && (
        <ModalEliminarEstudiante
          estudiante={{
            id: studentToDelete.id,
            username: studentToDelete.correo || studentToDelete.correo_personal || '',
            first_name: studentToDelete.nombres,
            last_name: studentToDelete.apellidos,
            email: studentToDelete.correo_personal || studentToDelete.correo || ''
          }}
          onClose={() => {
            setShowDeleteModal(false);
            setStudentToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default GestionEstudiantes;
