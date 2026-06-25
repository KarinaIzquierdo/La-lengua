import React, { useEffect, useMemo, useState } from 'react';
import './Dashboard_Profesor.css';
import { clbService, type Club } from '../../services/clbService';

interface MisClubsProps {}

export default function MisClubs(_props: MisClubsProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [allClubsStudents, setAllClubsStudents] = useState<{[clubId: number]: any[]}>({});
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const usersPerPage = 12;

  const [form, setForm] = useState({ name: '', description: '' });

  const [showEditClub, setShowEditClub] = useState(false);
  const [editForm, setEditForm] = useState<{ id: number | null; name: string; description: string }>({
    id: null,
    name: '',
    description: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingClubId, setDeletingClubId] = useState<number | null>(null);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const c = await clbService.getClubs();
      setClubs(c);
      
      // Cargar estudiantes de todos los clubs para el contador
      const studentsMap: {[clubId: number]: any[]} = {};
      for (const club of c) {
        try {
          const list = await clbService.listStudents(club.id);
          studentsMap[club.id] = list;
        } catch (e) {
          studentsMap[club.id] = [];
        }
      }
      setAllClubsStudents(studentsMap);
      
      if (!selectedClub && c.length > 0) {
        setSelectedClub(c[0]);
      }
    } catch (e) {
      console.error('Error loading clubs:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (clubId: number) => {
    try {
      const list = await clbService.listStudents(clubId);
      setStudents(list);
      // Actualizar también el contador del club
      setAllClubsStudents(prev => ({
        ...prev,
        [clubId]: list
      }));
    } catch (e) {
      console.error('Error loading students:', e);
    }
  };

  const loadAllUsers = async () => {
    try {
      const list = await clbService.listAllUsers();
      setAllUsers(list);
    } catch (e) {
      console.error('Error loading users:', e);
    }
  };

  useEffect(() => {
    loadClubs();
    loadAllUsers();
  }, []);

  useEffect(() => {
    if (selectedClub) loadStudents(selectedClub.id);
  }, [selectedClub?.id]);

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    try {
      setCreating(true);
      const created = await clbService.createClub({ name: form.name.trim(), description: form.description.trim() });
      setShowCreate(false);
      setForm({ name: '', description: '' });
      setClubs(prev => [created, ...prev]);
      setSelectedClub(created);
    } catch (e) {
      console.error('Error creating club:', e);
      alert('No se pudo crear el club');
    } finally {
      setCreating(false);
    }
  };

  const openEditClub = (club: Club) => {
    setEditForm({ id: club.id, name: club.name, description: club.description || '' });
    setShowEditClub(true);
  };

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id) return;
    if (!editForm.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    try {
      setSavingEdit(true);
      const updated = await clbService.updateClub(editForm.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
      });
      setClubs(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setSelectedClub(prev => (prev && prev.id === updated.id ? updated : prev));
      setShowEditClub(false);
    } catch (e) {
      console.error('Error updating club:', e);
      alert('No se pudo actualizar el club');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClub = async (club: Club) => {
    if (!confirm(`¿Eliminar el club "${club.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      setDeletingClubId(club.id);
      await clbService.deleteClub(club.id);
      setClubs(prev => {
        const updated = prev.filter(c => c.id !== club.id);
        if (selectedClub?.id === club.id) {
          setSelectedClub(updated[0] || null);
          setStudents([]);
        }
        return updated;
      });
      setAllClubsStudents(prev => {
        const copy = { ...prev };
        delete copy[club.id];
        return copy;
      });
    } catch (e) {
      console.error('Error deleting club:', e);
      alert('No se pudo eliminar el club');
    } finally {
      setDeletingClubId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Helper para normalizar niveles a etiquetas A1–C2
    const normalizeToCEFR = (u: any): string => {
      const raw = String(u.level || u.english_level || '').trim().toLowerCase();
      const bloque = String(u.bloque_asignado || '').trim().toUpperCase();

      // 1) Si bloque_asignado empieza por A1..C2, úsalo
      const m = bloque.match(/^(A1|A2|B1|B2|C1|C2)/);
      if (m) return m[1];

      // 2) Si level ya es A1..C2
      const rawUp = (u.level || '').toUpperCase();
      if (['A1','A2','B1','B2','C1','C2'].includes(rawUp)) return rawUp;

      // 3) Mapear comunes en english_level
      // Nota: esto es una aproximación
      if (raw.includes('beginner') || raw.includes('basic')) return 'A1';
      if (raw.includes('elementary')) return 'A2';
      if (raw.includes('pre-intermediate')) return 'B1';
      if (raw.includes('intermediate')) return 'B1';
      if (raw.includes('upper') || raw.includes('upper-intermediate')) return 'B2';
      if (raw.includes('advanced')) return 'C1';
      if (raw.includes('proficient') || raw.includes('c2')) return 'C2';

      return '';
    };

    return allUsers
      .filter(u => (u.role ? String(u.role).toLowerCase() === 'student' : true))
      .filter(u => {
        if (!levelFilter) return true;
        return normalizeToCEFR(u) === levelFilter.toUpperCase();
      })
      .filter(u => {
        if (!q) return true;
        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        return name.includes(q) || String(u.email || '').toLowerCase().includes(q);
      });
  }, [allUsers, levelFilter, search]);

  // Paginación de usuarios disponibles
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPageUsers - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPageUsers, usersPerPage]);

  const totalPagesUsers = Math.ceil(filteredUsers.length / usersPerPage);

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSelectedUsers = async () => {
    if (!selectedClub) return;
    if (selectedUserIds.length === 0) {
      alert('Selecciona al menos un estudiante.');
      return;
    }
    try {
      for (const id of selectedUserIds) {
        await clbService.addStudentById(selectedClub.id, id);
      }
      setSelectedUserIds([]);
      await loadStudents(selectedClub.id);
    } catch (e) {
      console.error('Error adding selected students:', e);
      alert('No se pudieron agregar algunos estudiantes.');
    }
  };

  const removeStudent = async (userId: number) => {
    if (!selectedClub) return;
    if (!confirm('¿Remover este estudiante del club?')) return;
    try {
      await clbService.removeStudent(selectedClub.id, userId);
      await loadStudents(selectedClub.id);
    } catch (e) {
      console.error('Error removing student:', e);
      alert('No se pudo remover el estudiante.');
    }
  };

  return (
    <div className="dashboard-content">
      {/* Botón Crear Club */}
      <button className="btn-add-class" onClick={() => setShowCreate(true)}>
        + AGREGAR CLUB
      </button>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Crear club</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={createClub} className="galeria-form">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creando…' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><p>Cargando…</p></div>
      ) : clubs.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes clubs aún</h3>
          <p>Usa el botón "AGREGAR CLUB" para comenzar</p>
        </div>
      ) : (
        <div className="clubs-list-container">
          {/* Lista de Clubs */}
          <div className="clubs-list-section">
            <h2 className="section-title">Lista de Clubs</h2>
            <div className="clubs-cards-grid">
              {clubs.map(c => (
                <div 
                  key={c.id} 
                  className={`club-card ${selectedClub?.id === c.id ? 'selected' : ''}`}
                  onClick={() => setSelectedClub(c)}
                >
                  <div className="club-card-header">
                    <h3>{c.name}</h3>
                    <span className="club-badge">{(allClubsStudents[c.id] || []).length} estudiantes</span>
                  </div>
                  <p className="club-description">{c.description || 'Sin descripción'}</p>
                  <div className="club-card-footer">
                    <span className="club-profesor">👤 {c.profesor_name ?? 'Yo'}</span>
                    <div className="club-card-actions">
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditClub(c);
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        disabled={deletingClubId === c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClub(c);
                        }}
                      >
                        {deletingClubId === c.id ? 'Eliminando…' : '🗑️ Eliminar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalles del Club Seleccionado */}
          {selectedClub && (
            <div className="club-details-section">
              <div className="users-table-container">
                <h3>Gestión de Estudiantes - {selectedClub.name}</h3>
                
                {/* Filtros */}
                <div className="user-picker-header">
                  <div className="user-picker-filters">
                    <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                      <option value="">Todos los niveles</option>
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tabla Unificada */}
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Club Asignado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((u) => {
                        const isAssigned = students.some(s => s.id === u.id);
                        return (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Sin nombre'}</td>
                            <td>{u.email}</td>
                            <td>
                              {isAssigned ? (
                                <span className="club-badge-assigned">{selectedClub.name}</span>
                              ) : (
                                <span className="club-badge-unassigned">Sin asignar</span>
                              )}
                            </td>
                            <td>
                              {isAssigned ? (
                                <button className="action-button deactivate-button" onClick={() => removeStudent(Number(u.id))}>
                                  Remover
                                </button>
                              ) : (
                                <button className="action-button activate-button" onClick={async () => {
                                  try {
                                    await clbService.addStudentById(selectedClub.id, Number(u.id));
                                    await loadStudents(selectedClub.id);
                                  } catch (e) {
                                    console.error('Error adding student:', e);
                                    alert('No se pudo agregar el estudiante.');
                                  }
                                }}>
                                  Asignar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }}>No hay estudiantes para mostrar</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {filteredUsers.length > 0 && (
                  <div className="pagination" style={{ marginTop: '20px' }}>
                    <button 
                      onClick={() => setCurrentPageUsers(prev => Math.max(1, prev - 1))}
                      disabled={currentPageUsers === 1 || totalPagesUsers <= 1}
                      className="pagination-btn"
                    >
                      ← Anterior
                    </button>
                    <span className="pagination-info">
                      Página {currentPageUsers} de {totalPagesUsers} ({filteredUsers.length} estudiantes)
                    </span>
                    <button 
                      onClick={() => setCurrentPageUsers(prev => Math.min(totalPagesUsers, prev + 1))}
                      disabled={currentPageUsers === totalPagesUsers || totalPagesUsers <= 1}
                      className="pagination-btn"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showEditClub && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Editar club</h3>
              <button className="close-btn" onClick={() => setShowEditClub(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateClub} className="galeria-form">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditClub(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
