import React, { useEffect, useState } from 'react';
import './admin.css';
import { API_BASE_URL } from '../../config/api';
import { authService } from '../../services/authService';

export interface DailyChallengeAdminItem {
  id: number;
  pregunta: string;
  categoria: 'vocabulary' | 'grammar' | 'conversation' | 'general' | string;
  nivel?: string | null;
  opcion_a: string;
  opcion_b: string;
  opcion_c?: string | null;
  opcion_d?: string | null;
  respuesta_correcta: 'A' | 'B' | 'C' | 'D';
  explicacion?: string | null;
  activo: boolean;
  created_at?: string;
}

const getAuthHeaders = (): HeadersInit => {
  const token = authService.getToken?.() || localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const RetosDiariosAdmin: React.FC = () => {
  const [items, setItems] = useState<DailyChallengeAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<DailyChallengeAdminItem>>({
    categoria: 'general',
    respuesta_correcta: 'A',
    activo: true,
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      categoria: 'general',
      respuesta_correcta: 'A',
      activo: true,
    });
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/daily-challenges/admin/`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudieron cargar los retos');
      }
      setItems(data.data || []);
    } catch (e: any) {
      console.error('Error cargando retos diarios:', e);
      setError(e.message || 'Error cargando retos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.pregunta || !form.opcion_a || !form.opcion_b) {
      alert('La pregunta y al menos las opciones A y B son obligatorias');
      return;
    }

    const payload: any = {
      pregunta: form.pregunta,
      categoria: form.categoria || 'general',
      nivel: form.nivel || '',
      opcion_a: form.opcion_a,
      opcion_b: form.opcion_b,
      opcion_c: form.opcion_c || '',
      opcion_d: form.opcion_d || '',
      respuesta_correcta: form.respuesta_correcta || 'A',
      explicacion: form.explicacion || '',
      activo: form.activo ?? true,
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_BASE_URL}/daily-challenges/admin/${editingId}/`
        : `${API_BASE_URL}/daily-challenges/admin/`;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'No se pudo guardar el reto');
      }
      resetForm();
      await load();
    } catch (e: any) {
      console.error('Error guardando reto diario:', e);
      alert(e.message || 'No se pudo guardar el reto');
    }
  };

  const handleEdit = (item: DailyChallengeAdminItem) => {
    setEditingId(item.id);
    setForm({ ...item });
  };

  const handleDelete = async (item: DailyChallengeAdminItem) => {
    if (!confirm('¿Eliminar este reto?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/daily-challenges/admin/${item.id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'No se pudo eliminar el reto');
      }
      if (editingId === item.id) resetForm();
      await load();
    } catch (e: any) {
      console.error('Error eliminando reto diario:', e);
      alert(e.message || 'No se pudo eliminar el reto');
    }
  };

  const toggleActive = async (item: DailyChallengeAdminItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/daily-challenges/admin/${item.id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ activo: !item.activo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'No se pudo actualizar el reto');
      }
      await load();
    } catch (e: any) {
      console.error('Error actualizando reto diario:', e);
      alert(e.message || 'No se pudo actualizar el reto');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>🔥 Retos Diarios</h2>
        <p>Configura las preguntas que verán los estudiantes en el reto diario de su dashboard.</p>
      </header>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3>{editingId ? 'Editar reto diario' : 'Nuevo reto diario'}</h3>
        <form onSubmit={handleSubmit} className="gestion-form">
          <div className="form-group">
            <label>Pregunta</label>
            <textarea
              value={form.pregunta || ''}
              onChange={e => setForm({ ...form, pregunta: e.target.value })}
              rows={3}
              placeholder="Escribe la pregunta del reto"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={form.categoria || 'general'}
                onChange={e => setForm({ ...form, categoria: e.target.value as any })}
              >
                <option value="general">General</option>
                <option value="vocabulary">Vocabulario</option>
                <option value="grammar">Gramática</option>
                <option value="conversation">Conversación</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nivel (opcional)</label>
              <input
                value={form.nivel || ''}
                onChange={e => setForm({ ...form, nivel: e.target.value })}
                placeholder="Ej: A1, B1, Intermedio"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Opción A *</label>
              <input
                value={form.opcion_a || ''}
                onChange={e => setForm({ ...form, opcion_a: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Opción B *</label>
              <input
                value={form.opcion_b || ''}
                onChange={e => setForm({ ...form, opcion_b: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Opción C</label>
              <input
                value={form.opcion_c || ''}
                onChange={e => setForm({ ...form, opcion_c: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Opción D</label>
              <input
                value={form.opcion_d || ''}
                onChange={e => setForm({ ...form, opcion_d: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Respuesta correcta</label>
              <select
                value={form.respuesta_correcta || 'A'}
                onChange={e => setForm({ ...form, respuesta_correcta: e.target.value as any })}
              >
                <option value="A">Opción A</option>
                <option value="B">Opción B</option>
                <option value="C">Opción C</option>
                <option value="D">Opción D</option>
              </select>
            </div>
            <div className="form-group">
              <label>Activo</label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.activo ?? true}
                  onChange={e => setForm({ ...form, activo: e.target.checked })}
                />
                Mostrar este reto a los estudiantes
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Explicación (se muestra después de responder)</label>
            <textarea
              value={form.explicacion || ''}
              onChange={e => setForm({ ...form, explicacion: e.target.value })}
              rows={3}
              placeholder="Explica por qué la respuesta es correcta"
            />
          </div>

          <div>
            <button className="form-submit-btn" type="submit">
              {editingId ? 'Guardar cambios' : 'Crear reto'}
            </button>
            {editingId && (
              <button
                type="button"
                className="form-cancel-btn"
                onClick={resetForm}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3>Listado de retos diarios</h3>
        {loading ? (
          <div>Cargando...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No hay retos configurados</h3>
            <p>Crea tu primer reto diario usando el formulario de arriba.</p>
          </div>
        ) : (
          <table className="classes-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>Categoría</th>
                <th>Nivel</th>
                <th>Respuesta</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.pregunta.length > 80 ? item.pregunta.slice(0, 80) + '…' : item.pregunta}</td>
                  <td>{item.categoria}</td>
                  <td>{item.nivel || '—'}</td>
                  <td>{item.respuesta_correcta}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-toggle" 
                      onClick={() => toggleActive(item)}
                      style={{ background: item.activo ? '#10b981' : '#e5e7eb', color: item.activo ? 'white' : '#4b5563' }}
                    >
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="actions-cell daily-actions-cell">
                    <button
                      type="button"
                      className="daily-action-btn daily-edit-btn"
                      onClick={() => handleEdit(item)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="daily-action-btn daily-delete-btn"
                      onClick={() => handleDelete(item)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RetosDiariosAdmin;
