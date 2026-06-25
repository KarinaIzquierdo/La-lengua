import { useState, useEffect } from 'react';
import './admin.css';
import { especializacionService, type Especializacion } from '../../services/especializacionService';

const Especializaciones = () => {
  const [especializaciones, setEspecializaciones] = useState<Especializacion[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar especializaciones al montar el componente
  useEffect(() => {
    loadEspecializaciones();
  }, []);

  const loadEspecializaciones = async () => {
    setLoading(true);
    try {
      console.log('Cargando especializaciones...');
      const data = await especializacionService.getEspecializaciones();
      console.log('Especializaciones recibidas:', data);
      setEspecializaciones(data);
    } catch (error) {
      console.error('Error loading especializaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [especializacionEditando, setEspecializacionEditando] = useState<Especializacion | null>(null);
  const [nuevaEspecializacion, setNuevaEspecializacion] = useState({
    nombre: '',
    descripcion: '',
    duracion: '',
    precio: 0,
    activa: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (especializacionEditando) {
        // Editar especialización existente
        const result = await especializacionService.updateEspecializacion(
          especializacionEditando.id, 
          nuevaEspecializacion
        );
        if (result.success) {
          await loadEspecializaciones();
        } else {
          console.error('Error updating especializacion:', result.errors);
        }
      } else {
        // Crear nueva especialización
        const result = await especializacionService.createEspecializacion(nuevaEspecializacion);
        if (result.success) {
          await loadEspecializaciones();
        } else {
          console.error('Error creating especializacion:', result.errors);
        }
      }
      
      // Resetear formulario
      setNuevaEspecializacion({
        nombre: '',
        descripcion: '',
        duracion: '',
        precio: 0,
        activa: true
      });
      setEspecializacionEditando(null);
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (esp: Especializacion) => {
    setEspecializacionEditando(esp);
    setNuevaEspecializacion({
      nombre: esp.nombre,
      descripcion: esp.descripcion,
      duracion: esp.duracion,
      precio: esp.precio,
      activa: esp.activa
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta especialización?')) {
      setLoading(true);
      try {
        const result = await especializacionService.deleteEspecializacion(id);
        if (result.success) {
          await loadEspecializaciones();
        } else {
          console.error('Error deleting especializacion:', result.message);
        }
      } catch (error) {
        console.error('Error in handleEliminar:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleActiva = async (id: number) => {
    setLoading(true);
    try {
      const result = await especializacionService.toggleEspecializacion(id);
      if (result.success) {
        await loadEspecializaciones();
      } else {
        console.error('Error toggling especializacion:', result.message);
      }
    } catch (error) {
      console.error('Error in toggleActiva:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setEspecializacionEditando(null);
    setNuevaEspecializacion({
      nombre: '',
      descripcion: '',
      duracion: '',
      precio: 0,
      activa: true
    });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Gestión de Especializaciones</h2>
        <p>Administra las especializaciones disponibles para los estudiantes.</p>
      </header>

      {/* Botón para agregar nueva especialización */}
      <div className="actions-bar">
        <button 
          className="btn-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nueva Especialización
        </button>
      </div>

      {/* Formulario para crear/editar especialización */}
      {mostrarFormulario && (
        <div className="form-modal">
          <div className="form-container">
            <h3>{especializacionEditando ? 'Editar Especialización' : 'Nueva Especialización'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre de la Especialización</label>
                <input
                  type="text"
                  id="nombre"
                  value={nuevaEspecializacion.nombre}
                  onChange={(e) => setNuevaEspecializacion(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  placeholder="Ej: Inglés para Finanzas"
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={nuevaEspecializacion.descripcion}
                  onChange={(e) => setNuevaEspecializacion(prev => ({ ...prev, descripcion: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Describe el contenido y objetivos de la especialización..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duracion">Duración</label>
                  <input
                    type="text"
                    id="duracion"
                    value={nuevaEspecializacion.duracion}
                    onChange={(e) => setNuevaEspecializacion(prev => ({ ...prev, duracion: e.target.value }))}
                    required
                    placeholder="Ej: 8 semanas"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="precio">Precio (USD)</label>
                  <input
                    type="number"
                    id="precio"
                    value={nuevaEspecializacion.precio}
                    onChange={(e) => setNuevaEspecializacion(prev => ({ ...prev, precio: Number(e.target.value) }))}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={nuevaEspecializacion.activa}
                    onChange={(e) => setNuevaEspecializacion(prev => ({ ...prev, activa: e.target.checked }))}
                  />
                  Especialización activa
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={cancelarFormulario} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Procesando...' : (especializacionEditando ? 'Actualizar' : 'Crear')} Especialización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de especializaciones */}
      <div className="especializaciones-grid">
        {especializaciones.map((esp) => (
          <div key={esp.id} className={`especialization-card ${!esp.activa ? 'inactive' : ''}`}>
            <div className="card-header">
              <h3>{esp.nombre}</h3>
              <div className="card-status">
                <span className={`status-badge ${esp.activa ? 'active' : 'inactive'}`}>
                  {esp.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
            
            <div className="card-content">
              <p className="description">{esp.descripcion}</p>
              
              <div className="card-details">
                <div className="detail-item">
                  <span className="label">Duración:</span>
                  <span className="value">{esp.duracion}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Precio:</span>
                  <span className="value">${esp.precio}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Creada:</span>
                  <span className="value">{new Date(esp.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button 
                onClick={() => handleEditar(esp)}
                className="btn-edit"
              >
                Editar
              </button>
              <button 
                onClick={() => toggleActiva(esp.id)}
                className={`btn-toggle ${esp.activa ? 'active' : 'inactive'}`}
                disabled={loading}
              >
                {esp.activa ? 'Desactivar' : 'Activar'}
              </button>
              <button 
                onClick={() => handleEliminar(esp.id)}
                className="btn-delete"
                disabled={loading}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {especializaciones.length === 0 && (
        <div className="empty-state">
          <h3>No hay especializaciones creadas</h3>
          <p>Crea la primera especialización para que los estudiantes puedan inscribirse.</p>
        </div>
      )}
    </div>
  );
};

export default Especializaciones;
