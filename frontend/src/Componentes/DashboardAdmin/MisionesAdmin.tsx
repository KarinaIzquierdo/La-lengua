import { useEffect, useState } from 'react';
import { missionService, type MissionLink } from '../../services/missionService';
import { userService } from '../../services/userService';
import './admin.css';

export default function MisionesAdmin() {
  const [items, setItems] = useState<MissionLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<MissionLink>>({ mission_key: '', platform: 'custom', url: '', is_active: true, audience_type: 'global' as any, audience_value: '', user: undefined });
  const [filterKey, setFilterKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await missionService.list(filterKey || undefined);
      setItems(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error cargando enlaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterKey]);

  // Cargar usuarios (para audience student)
  useEffect(() => {
    const fetchAux = async () => {
      try {
        const list = await userService.getAll();
        setUsers(list.map(u => ({ id: u.id, name: `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.correo_personal || String(u.id) })));
      } catch {
        setUsers([]);
      }
    };
    fetchAux();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.mission_key || !form.url) {
        alert('mission_key y url son obligatorios');
        return;
      }
      await missionService.create(form);
      setForm({ mission_key: '', platform: 'custom', url: '', is_active: true, audience_type: 'global' as any, audience_value: '', user: undefined });
      await load();
    } catch (e: any) {
      alert(e.message || 'No se pudo crear');
    }
  };

  const toggleActive = async (item: MissionLink) => {
    await missionService.update(item.id, { is_active: !item.is_active });
    await load();
  };

  const expireNow = async (item: MissionLink) => {
    await missionService.update(item.id, { expires_at: new Date().toISOString() });
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este enlace?')) return;
    await missionService.remove(id);
    await load();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Gestión de Misiones</h2>
        <p>Administra enlaces externos (Gimkit, Kahoot, Quizizz) y su vigencia.</p>
      </header>

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3>Nuevo enlace</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto' }}>
          <input placeholder="mission_key (slug)" value={form.mission_key || ''} onChange={e => setForm({ ...form, mission_key: e.target.value })} />
          <select value={form.platform || 'custom'} onChange={e => setForm({ ...form, platform: e.target.value as any })}>
            <option value="custom">Custom</option>
            <option value="gimkit">Gimkit</option>
            <option value="kahoot">Kahoot</option>
            <option value="quizizz">Quizizz</option>
          </select>
          <input placeholder="URL" value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })} />
          <select value={(form.audience_type as any) || 'global'} onChange={e => setForm({ ...form, audience_type: e.target.value as any })}>
            <option value="global">Global</option>
            <option value="student">Por Estudiante</option>
          </select>
          {form.audience_type === 'student' && (
            <select value={form.user as any || ''} onChange={e => setForm({ ...form, user: Number(e.target.value) })}>
              <option value="">Seleccione estudiante…</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Activo
          </label>
          <button className="btn-primary" type="submit">Guardar</button>
        </form>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3>Enlaces</h3>
          <input placeholder="Filtrar por mission_key" value={filterKey} onChange={e => setFilterKey(e.target.value)} />
        </div>
        {loading ? (
          <div>Cargando...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>mission_key</th>
                <th>platform</th>
                <th>url</th>
                <th>audiencia</th>
                <th>vigencia</th>
                <th>estado</th>
                <th>acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.mission_key}</td>
                  <td style={{ textAlign: 'center' }}>{item.platform}</td>
                  <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</td>
                  <td style={{ textAlign: 'center' }}>
                    {item.status ? (
                      <>
                        {(() => {
                          // Render audience info compact
                          const at: any = (item as any).audience_type;
                          if (at === 'bloque') return `bloque: ${(item as any).audience_value || '—'}`;
                          if (at === 'student') return `student: ${(item as any).user || '—'}`;
                          return 'global';
                        })()}
                      </>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.start_at ? new Date(item.start_at).toLocaleString() : '—'} → {item.expires_at ? new Date(item.expires_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.status}{item.is_active ? '' : ' (off)'}</td>
                  <td className="misiones-actions-cell">
                    <button className="btn-primary" onClick={() => toggleActive(item)}>{item.is_active ? 'Desactivar' : 'Activar'}</button>
                    <button className="btn-primary" onClick={() => expireNow(item)}>Expirar ahora</button>
                    <button className="btn-danger" onClick={() => remove(item.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
