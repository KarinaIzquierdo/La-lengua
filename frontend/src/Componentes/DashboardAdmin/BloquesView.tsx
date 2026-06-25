import React, { useState, useEffect } from 'react';
import './admin.css';
import { bloqueService, type BloqueData, type Bloque } from '../../services/bloqueService';
import { profesorService, type Profesor } from '../../services/profesorService';

const niveles = bloqueService.getNivelesDisponibles();
const turnos = bloqueService.getTurnosDisponibles();

const DetalleModal = ({ visible, onClose, title, children }: any) => {
  if (!visible) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose}>
          ×
        </button>
        <h3>{title}</h3>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const defaultNuevoBloque: BloqueData = {
  nivel: '',
  turno: '',
  profesores: '',
  clases: '',
  misiones: '',
  horarios: '',
  fechasClases: '',
  meetLinks: ''
};

export default function BloquesView() {
  const [modal, setModal] = useState<{visible: boolean, title: string, content: React.ReactNode}>({visible: false, title: '', content: null});
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [showCrear, setShowCrear] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [bloqueEditando, setBloqueEditando] = useState<Bloque | null>(null);
  const [nuevoBloque, setNuevoBloque] = useState(defaultNuevoBloque);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [profesoresSeleccionados, setProfesoresSeleccionados] = useState<number[]>([]);

  // Cargar bloques y profesores al montar el componente
  useEffect(() => {
    const bloquesGuardados = bloqueService.getBloques();
    setBloques(bloquesGuardados);
    
    // Cargar profesores desde el backend
    const cargarProfesores = async () => {
      const profesoresData = await profesorService.getProfesores();
      setProfesores(profesoresData);
    };
    cargarProfesores();
  }, []);

  const handleOpen = (bloque: string, tipo: string) => {
    console.log('handleOpen llamado con:', bloque, tipo);
    let content = null;
    if (tipo === 'Bloque') {
      const b = bloques.find(b => b.nivel + ' ' + b.turno === bloque);
      console.log('Bloque encontrado:', b);
      if (b) {
        const clasesHorarios = b.clases.map((clase: string, i: number) => ({
          clase,
          horario: b.horarios[i] || 'Sin horario asignado',
          meetLink: (b.meetLinks && b.meetLinks[i]) || 'Sin enlace de Meet'
        }));
        content = (
          <div>
            <h4>Profesores asignados</h4>
            <ul>{b.profesores.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
            <h4>Clases, horarios y enlaces de Meet</h4>
            <table className="tabla-clases-horarios">
              <thead>
                <tr><th>Clase</th><th>Horario</th><th>Enlace Meet</th></tr>
              </thead>
              <tbody>
                {clasesHorarios.map((ch: {clase: string, horario: string, meetLink: string}, i: number) => (
                  <tr key={i}>
                    <td>{ch.clase}</td>
                    <td>{ch.horario}</td>
                    <td>
                      {ch.meetLink !== 'Sin enlace de Meet' ? (
                        <a href={ch.meetLink} target="_blank" rel="noopener noreferrer">
                          📹 Meet
                        </a>
                      ) : (
                        <span style={{color: '#999', fontSize: '11px'}}>Sin enlace</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h4>Misiones</h4>
            <ul>{b.misiones.map((m: string, i: number) => <li key={i}>{m}</li>)}</ul>
            <div className="modal-actions" style={{marginTop: '20px'}}>
              <button 
                className="modal-btn modal-btn-edit" 
                onClick={() => handleEditarBloque(b)}
              >
                ✏️ Editar Bloque
              </button>
              <button 
                className="modal-btn modal-btn-delete" 
                onClick={() => handleEliminarBloque(b.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        );
      } else {
        content = <div>No hay datos para este bloque.</div>;
      }
    }
    console.log('Abriendo modal con contenido:', content);
    setModal({visible: true, title: `Detalles de ${bloque}`, content});
  };

  const handleEditarBloque = (bloque: Bloque) => {
    console.log('Editando bloque:', bloque);
    setBloqueEditando(bloque);
    setNuevoBloque(bloqueService.bloqueToData(bloque));
    setShowEditar(true);
    setModal({visible: false, title: '', content: null});
  };

  const handleEliminarBloque = (bloqueId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este bloque?')) {
      bloqueService.deleteBloque(bloqueId);
      const bloquesActualizados = bloqueService.getBloques();
      setBloques(bloquesActualizados);
      setModal({visible: false, title: '', content: null});
    }
  };

  const handleCrearBloque = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que se hayan seleccionado profesores
    if (profesoresSeleccionados.length === 0) {
      alert('Debes seleccionar al menos un profesor');
      return;
    }
    
    // Convertir IDs de profesores a nombres
    const profesoresNombres = profesoresSeleccionados
      .map(id => profesores.find(p => p.id === id)?.full_name)
      .filter(Boolean)
      .join(', ');
    
    // Crear el bloque con los profesores seleccionados
    const bloqueData = {
      ...nuevoBloque,
      profesores: profesoresNombres
    };
    
    const bloque = bloqueService.saveBloque(bloqueData);
    const bloquesActualizados = bloqueService.getBloques();
    setBloques(bloquesActualizados);
    
    // Enviar notificaciones a los profesores seleccionados
    for (const profesorId of profesoresSeleccionados) {
      await profesorService.notificarAsignacionBloque(profesorId, bloque);
    }
    
    // Resetear formulario
    setNuevoBloque(defaultNuevoBloque);
    setProfesoresSeleccionados([]);
    setShowCrear(false);
  };

  const handleActualizarBloque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bloqueEditando) {
      // Guardar el bloque actualizado
      const bloqueActualizado = bloqueService.saveBloque(nuevoBloque as BloqueData);
      const bloquesActualizados = bloqueService.getBloques();
      setBloques(bloquesActualizados);
      
      // Obtener profesores seleccionados del string
      const profesoresNombres = nuevoBloque.profesores.split(',').map(p => p.trim()).filter(p => p);
      
      // Encontrar IDs de profesores por nombre
      const profesoresIds = profesoresNombres
        .map(nombre => profesores.find(p => `${p.first_name} ${p.last_name}` === nombre)?.id)
        .filter(Boolean);
      
      // Enviar notificaciones a los profesores asignados
      for (const profesorId of profesoresIds) {
        await profesorService.notificarAsignacionBloque(profesorId, bloqueActualizado);
      }
      
      setShowEditar(false);
      setBloqueEditando(null);
      setNuevoBloque(defaultNuevoBloque);
    }
  };

  const generateMeetLink = () => {
    return `https://meet.google.com/new`;
  };

  const addMeetLink = () => {
    const newLink = generateMeetLink();
    const currentLinks = nuevoBloque.meetLinks ? nuevoBloque.meetLinks + ', ' + newLink : newLink;
    setNuevoBloque({...nuevoBloque, meetLinks: currentLinks});
  };

  return (
    <div className="bloques-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Bloques</h2>
        <button className="crear-bloque-btn" onClick={() => setShowCrear(true)}>+ Crear bloque</button>
      </div>
      {niveles.map(nivel => (
        <div key={nivel} style={{marginBottom: 40}}>
          <h3 className="nivel-titulo">{nivel}</h3>
          <div className="sticky-notes-grid">
            {turnos.map(turno => {
              const nombre = `${nivel} ${turno}`;
              const bloqueExiste = bloques.some(b => b.nivel === nivel && b.turno === turno);
              return (
                <div 
                  className={`sticky-note sticky-${turno.toLowerCase()} ${bloqueExiste ? 'bloque-creado' : ''}`} 
                  key={nombre} 
                  onClick={() => handleOpen(nombre, 'Bloque')}
                >
                  <div className="pin"></div>
                  <div className="sticky-title">{turno}</div>
                  <div className="sticky-desc">
                    {bloqueExiste ? 'Bloque configurado' : 'Haz clic para ver detalles'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <DetalleModal visible={modal.visible} onClose={() => setModal({visible: false, title: '', content: null})} title={modal.title}>
        {modal.content}
      </DetalleModal>
      {/* Modal crear bloque */}
      {showCrear && (
        <div className="modal-backdrop" onClick={() => setShowCrear(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Crear nuevo bloque</h3>
            <form onSubmit={handleCrearBloque} className="form-crear-bloque">
              <label>Nivel
                <input 
                  type="text" 
                  required 
                  value={nuevoBloque.nivel} 
                  onChange={e => setNuevoBloque({...nuevoBloque, nivel: e.target.value})} 
                  placeholder="Ej: A1, A2, B1, B2, C1, C2" 
                />
              </label>
              <label>Turno
                <select required value={nuevoBloque.turno} onChange={e => setNuevoBloque({...nuevoBloque, turno: e.target.value})}>
                  <option value="">Selecciona turno</option>
                  {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Profesores
                <div className="profesores-selector">
                  <div className="profesores-checkboxes">
                    {profesores.map(profesor => (
                      <label key={profesor.id} className="checkbox-profesor">
                        <input
                          type="checkbox"
                          checked={profesoresSeleccionados.includes(profesor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfesoresSeleccionados([...profesoresSeleccionados, profesor.id]);
                            } else {
                              setProfesoresSeleccionados(profesoresSeleccionados.filter(id => id !== profesor.id));
                            }
                          }}
                        />
                        <span>{profesor.full_name}</span>
                      </label>
                    ))}
                  </div>
                  {profesoresSeleccionados.length === 0 && (
                    <p className="no-profesores-selected">Selecciona al menos un profesor</p>
                  )}
                </div>
              </label>
              <label>Clases (separadas por coma)
                <input required value={nuevoBloque.clases} onChange={e => setNuevoBloque({...nuevoBloque, clases: e.target.value})} placeholder="Ej: Clase 1, Clase 2" />
              </label>
              <label>Misiones (separadas por coma)
                <input required value={nuevoBloque.misiones} onChange={e => setNuevoBloque({...nuevoBloque, misiones: e.target.value})} placeholder="Ej: Misión 1, Misión 2" />
              </label>
              <label>Horarios (separados por coma)
                <input required value={nuevoBloque.horarios} onChange={e => setNuevoBloque({...nuevoBloque, horarios: e.target.value})} placeholder="Ej: Lunes 8:00-10:00, Miércoles 10:00-12:00" />
              </label>
              <label>Enlaces de Google Meet (separados por coma)
                <div style={{display: 'flex', gap: '8px', alignItems: 'flex-end'}}>
                  <input 
                    value={nuevoBloque.meetLinks} 
                    onChange={e => setNuevoBloque({...nuevoBloque, meetLinks: e.target.value})} 
                    placeholder="Ej: https://meet.google.com/abc-defg-hij, https://meet.google.com/xyz-uvw-rst" 
                    style={{flex: 1}}
                  />
                  <button type="button" onClick={addMeetLink} className="crear-bloque-btn" style={{fontSize: '12px', padding: '6px 12px'}}>
                    + Meet
                  </button>
                </div>
              </label>
              <div style={{display:'flex', gap:12, marginTop:16}}>
                <button type="submit" className="crear-bloque-btn">Crear</button>
                <button type="button" className="close-btn" onClick={() => setShowCrear(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal editar bloque */}
      {showEditar && bloqueEditando && (
        <div className="modal-backdrop" onClick={() => setShowEditar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Editar bloque {bloqueEditando.nivel} {bloqueEditando.turno}</h3>
            <form onSubmit={handleActualizarBloque} className="form-crear-bloque">
              <label>Nivel
                <select required value={nuevoBloque.nivel} onChange={e => setNuevoBloque({...nuevoBloque, nivel: e.target.value})}>
                  <option value="">Selecciona nivel</option>
                  {niveles.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label>Turno
                <select required value={nuevoBloque.turno} onChange={e => setNuevoBloque({...nuevoBloque, turno: e.target.value})}>
                  <option value="">Selecciona turno</option>
                  {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Profesores
                <div className="profesores-selector-editar">
                  {profesores.map(profesor => (
                    <div key={profesor.id} className="profesor-checkbox">
                      <input
                        type="checkbox"
                        id={`edit-profesor-${profesor.id}`}
                        checked={nuevoBloque.profesores.split(',').map(p => p.trim()).includes(`${profesor.first_name} ${profesor.last_name}`)}
                        onChange={(e) => {
                          const profesorNombre = `${profesor.first_name} ${profesor.last_name}`;
                          const profesoresActuales = nuevoBloque.profesores.split(',').map(p => p.trim()).filter(p => p);
                          
                          if (e.target.checked) {
                            const nuevosProfesores = [...profesoresActuales, profesorNombre];
                            setNuevoBloque({...nuevoBloque, profesores: nuevosProfesores.join(', ')});
                          } else {
                            const nuevosProfesores = profesoresActuales.filter(p => p !== profesorNombre);
                            setNuevoBloque({...nuevoBloque, profesores: nuevosProfesores.join(', ')});
                          }
                        }}
                      />
                      <label htmlFor={`edit-profesor-${profesor.id}`} className="profesor-label">
                        {profesor.first_name} {profesor.last_name}
                        <span className="profesor-email">({profesor.email})</span>
                      </label>
                    </div>
                  ))}
                </div>
                {nuevoBloque.profesores.split(',').map(p => p.trim()).filter(p => p).length === 0 && (
                  <p className="error-message">Debe seleccionar al menos un profesor</p>
                )}
              </label>
              <label>Clases (separadas por coma)
                <input required value={nuevoBloque.clases} onChange={e => setNuevoBloque({...nuevoBloque, clases: e.target.value})} placeholder="Ej: Clase 1, Clase 2" />
              </label>
              <label>Misiones (separadas por coma)
                <input required value={nuevoBloque.misiones} onChange={e => setNuevoBloque({...nuevoBloque, misiones: e.target.value})} placeholder="Ej: Misión 1, Misión 2" />
              </label>
              <label>Horarios (separados por coma)
                <input required value={nuevoBloque.horarios} onChange={e => setNuevoBloque({...nuevoBloque, horarios: e.target.value})} placeholder="Ej: Lunes 8:00-10:00, Miércoles 10:00-12:00" />
              </label>
              <label>Enlaces de Google Meet (separados por coma)
                <div style={{display: 'flex', gap: '8px', alignItems: 'flex-end'}}>
                  <input 
                    value={nuevoBloque.meetLinks} 
                    onChange={e => setNuevoBloque({...nuevoBloque, meetLinks: e.target.value})} 
                    placeholder="Ej: https://meet.google.com/abc-defg-hij, https://meet.google.com/xyz-uvw-rst" 
                    style={{flex: 1}}
                  />
                  <button type="button" onClick={addMeetLink} className="crear-bloque-btn" style={{fontSize: '12px', padding: '6px 12px'}}>
                    + Meet
                  </button>
                </div>
              </label>
              <div style={{display:'flex', gap:12, marginTop:16}}>
                <button type="submit" className="crear-bloque-btn">Actualizar</button>
                <button type="button" className="close-btn" onClick={() => setShowEditar(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
