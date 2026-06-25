import React, { useEffect, useState } from 'react';
import './Dashboard_Profesor.css';
import { clbService, type Club, type ClubMaterial } from '../../services/clbService';

interface GestionCLBProps {
  profesorId?: number;
}

export default function GestionCLB({ profesorId = 1 }: GestionCLBProps) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<number | null>(null);
  const [materials, setMaterials] = useState<ClubMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ClubMaterial | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    week: '',
    title: '',
    description: '',
    resource_type: 'url' as 'url' | 'file',
    url: '',
    file: null as File | null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const c = await clbService.getClubs();
        setClubs(c);
        if (c.length > 0) {
          setSelectedClub(c[0].id);
        }
      } catch (e) {
        console.error('Error loading clubs:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadMaterials = async () => {
      if (!selectedClub) return;
      try {
        setLoading(true);
        const m = await clbService.getClubMaterials(selectedClub);
        setMaterials(m);
      } catch (e) {
        console.error('Error loading materials:', e);
      } finally {
        setLoading(false);
      }
    };
    loadMaterials();
  }, [selectedClub]);

  const resetForm = () => {
    setForm({ week: '', title: '', description: '', resource_type: 'url', url: '', file: null });
    setShowForm(false);
    setEditingMaterial(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) {
      alert('Selecciona un club');
      return;
    }
    if (!form.week || !form.title) {
      alert('Semana y Título son obligatorios');
      return;
    }
    if (form.resource_type === 'url') {
      const valid = /^https?:\/\//i.test(form.url);
      if (!valid) {
        alert('Ingresa una URL válida (http/https)');
        return;
      }
    }

    try {
      setSaving(true);
      if (editingMaterial) {
        const updated = await clbService.updateClubMaterial(editingMaterial.id, {
          week: form.week,
          title: form.title,
          description: form.description || undefined,
          url: form.resource_type === 'url' ? form.url : undefined,
        });
        setMaterials(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      } else {
        const payload = {
          week: form.week,
          title: form.title,
          description: form.description || undefined,
          resource_type: form.resource_type,
          url: form.resource_type === 'url' ? form.url : undefined,
          file: form.resource_type === 'file' ? form.file ?? undefined : undefined,
        } as any;
        const created = await clbService.createClubMaterial(selectedClub, payload);
        setMaterials(prev => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error('Error creating material:', err);
      alert('Error al guardar el material. Revisa tu conexión o permisos.');
    } finally {
      setSaving(false);
    }
  };

  const openEditMaterial = (item: ClubMaterial) => {
    setEditingMaterial(item);
    setForm({
      week: item.week,
      title: item.title,
      description: item.description || '',
      resource_type: item.resource_type,
      url: item.url || '',
      file: null,
    });
    setShowForm(true);
  };

  const handleDeleteMaterial = async (item: ClubMaterial) => {
    if (!confirm(`¿Eliminar el material "${item.title}"?`)) return;
    try {
      setDeletingId(item.id);
      await clbService.deleteClubMaterial(item.id);
      setMaterials(prev => prev.filter(m => m.id !== item.id));
    } catch (err) {
      console.error('Error deleting material:', err);
      alert('No se pudo eliminar el material.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="profesor-header">
        <div className="welcome-section">
          <h2>Gestión CLB</h2>
          <p>Carga semanalmente el material para tu club y estudiantes asignados</p>
        </div>
        <div className="stats-cards">
          <div className="stat-card" style={{ padding: 12 }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Club</label>
            <select
              value={selectedClub ?? ''}
              onChange={(e) => setSelectedClub(Number(e.target.value))}
              disabled={clubs.length === 0}
            >
              {clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {clubs.length === 0 && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                Primero crea un club en "Mis Clubs".
              </div>
            )}
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            ➕ Agregar material
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3>{editingMaterial ? 'Editar material de CLB' : 'Nuevo material de CLB'}</h3>
              <button className="close-btn" onClick={resetForm}>✕</button>
            </div>
            {clubs.length === 0 ? (
              <div className="galeria-form" style={{ padding: 16 }}>
                <p style={{ marginBottom: 16 }}>Aún no tienes clubs. Crea uno primero desde "Mis Clubs" y vuelve a intentar.</p>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={resetForm}>Entendido</button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSave} className="galeria-form">
              <div className="form-group">
                <label>Club</label>
                <select
                  value={selectedClub ?? ''}
                  onChange={(e) => setSelectedClub(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>Selecciona un club…</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Semana (ej: 2025-W37)</label>
                <input type="text" value={form.week} onChange={(e) => setForm({ ...form, week: e.target.value })} placeholder="YYYY-Www" required />
              </div>

              <div className="form-group">
                <label>Título</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tema de la semana" required />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descripción del material" />
              </div>

              <div className="form-group">
                <label>Recurso</label>
                <div className="content-input-options">
                  <label className="input-option">
                    <input type="radio" name="resourceType" checked={form.resource_type === 'url'} onChange={() => setForm({ ...form, resource_type: 'url' })} /> URL (http/s)
                  </label>
                  <label className="input-option">
                    <input type="radio" name="resourceType" checked={form.resource_type === 'file'} onChange={() => setForm({ ...form, resource_type: 'file' })} /> Archivo
                  </label>
                </div>
                {form.resource_type === 'url' ? (
                  <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
                ) : (
                  <input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} />
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      <div className="galeria-content">
        {loading ? (
          <div className="loading-state"><p>Cargando…</p></div>
        ) : !selectedClub ? (
          <div className="empty-state"><h3>Selecciona un club para ver materiales</h3></div>
        ) : materials.length === 0 ? (
          <div className="empty-state">
            <h3>No hay materiales cargados</h3>
            <p>Usa "Agregar material" para cargar el material semanal del club</p>
          </div>
        ) : (
          <div className="media-grid">
            {materials.map(item => (
              <div key={item.id} className="media-card">
                <div className="media-preview">
                  {item.resource_type === 'url' ? (
                    <img src={item.url} alt={item.title} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="video-preview">
                      <div className="play-overlay">📄</div>
                    </div>
                  )}
                  <div className="media-badge">Semana {item.week}</div>
                </div>
                <div className="media-info">
                  <h3>{item.title}</h3>
                  <p className="media-description">{item.description}</p>
                  <div className="media-meta">
                    <span>{new Date(item.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="media-actions">
                    {item.url && (
                      <a className="btn-edit" href={item.url} target="_blank" rel="noreferrer">🔗 Abrir recurso</a>
                    )}
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => openEditMaterial(item)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteMaterial(item)}
                    >
                      {deletingId === item.id ? 'Eliminando…' : '🗑️ Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
