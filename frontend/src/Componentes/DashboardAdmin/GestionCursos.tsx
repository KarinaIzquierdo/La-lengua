import React, { useState } from 'react';
import "./formulario-usuarios.css";
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const GestionCursos = () => {
  const [cursos, setCursos] = useState([
    { id: 1, nombre: 'C1', descripcion: 'Curso de cálculo y álgebra lineal.', profesorId: 1 },
    { id: 2, nombre: 'B1', descripcion: 'Recorrido por la historia del arte occidental.', profesorId: null },
    { id: 3, nombre: 'B2', descripcion: 'Aprende a construir aplicaciones web modernas.', profesorId: 1 },
  ]);

  const [profesores] = useState([
    { id: 1, nombres: 'Juan', apellidos: 'Pérez' },
    { id: 5, nombres: 'Laura', apellidos: 'López' },
  ]);

  const [formVisible, setFormVisible] = useState(false);
  const [cursoActual, setCursoActual] = useState<any>(null);

  const handleAdd = () => {
    setCursoActual(null);
    setFormVisible(true);
  };

  const handleEdit = (curso: any) => {
    setCursoActual(curso);
    setFormVisible(true);
  };

  const handleDelete = (cursoId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este curso?')) {
      setCursos(cursos.filter(c => c.id !== cursoId));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cursoData = {
      nombre: formData.get('nombre') as string,
      descripcion: formData.get('descripcion') as string,
      profesorId: parseInt(formData.get('profesorId') as string, 10) || null,
    };

    if (cursoActual) {
      setCursos(cursos.map(c => c.id === cursoActual.id ? { ...c, ...cursoData } : c));
    } else {
      const nuevoCurso = { id: Date.now(), ...cursoData };
      setCursos([...cursos, nuevoCurso]);
    }
    setFormVisible(false);
  };

  const getProfesorNombre = (profesorId: number | null) => {
    if (!profesorId) return 'No asignado';
    const profesor = profesores.find(p => p.id === profesorId);
    return profesor ? `${profesor.nombres} ${profesor.apellidos}` : 'Desconocido';
  };

  return (
    <div className="gestion-usuarios-container">
      <h2>Gestión de Cursos y Materias</h2>
      {!formVisible && (
        <>
          <button onClick={handleAdd} className="add-user-button">
            <FaPlus />
            Agregar Curso
          </button>
          <div className="users-table-container">
            <h3>Lista de Cursos</h3>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre del Curso</th>
                    <th>Descripción</th>
                    <th>Profesor Asignado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map((curso) => (
                    <tr key={curso.id}>
                      <td>{curso.id}</td>
                      <td>{curso.nombre}</td>
                      <td>{curso.descripcion}</td>
                      <td>{getProfesorNombre(curso.profesorId)}</td>
                      <td className="actions-cell">
                        <button onClick={() => handleEdit(curso)} className="action-button edit-button">
                          <FaEdit />
                          <span>Editar</span>
                        </button>
                        <button onClick={() => handleDelete(curso.id)} className="action-button deactivate-button">
                          <FaTrash />
                          <span>Eliminar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cursos.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                        No hay cursos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {formVisible && (
        <div className="form-usuarios-wrapper">
          <form className="form-usuarios" onSubmit={handleSave} style={{ margin: 0, maxWidth: '100%' }}>
            <h2>{cursoActual ? 'Editar Curso' : 'Agregar Nuevo Curso'}</h2>
            <div className="form-field">
              <label htmlFor="nombre">Nombre del Curso *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                defaultValue={cursoActual?.nombre || ''}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="descripcion">Descripción</label>
              <input
                type="text"
                id="descripcion"
                name="descripcion"
                defaultValue={cursoActual?.descripcion || ''}
              />
            </div>
            <div className="form-field">
              <label htmlFor="profesorId">Asignar Profesor</label>
              <select
                id="profesorId"
                name="profesorId"
                defaultValue={cursoActual?.profesorId || ''}
              >
                <option value="">Sin asignar</option>
                {profesores.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} {p.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div className="button-group">
              <button type="submit">Guardar</button>
              <button type="button" onClick={() => setFormVisible(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GestionCursos;
