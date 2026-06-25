import React, { useEffect, useState } from 'react';
import './admin.css';
import { API_BASE_URL } from '../../config/api';
import { authService } from '../../services/authService';

interface RankingItem {
  id: number;
  full_name: string;
  email: string;
  nivel: string;
  total_dulces: number;
  total_xp: number;
  reto_mejor_racha: number;
  reto_completados_total: number;
  reto_fallidos_total: number;
}

const NIVELES = [
  '',
  'A1', 'A1+',
  'A2', 'A2+',
  'B1', 'B1+',
  'B2', 'B2+',
  'C1', 'C1+',
  'C2',
];

// En algunos entornos API_BASE_URL puede apuntar al index.php de PHP.
// Este panel debe hablar con el backend Django, así que normalizamos
// eliminando un posible sufijo "/index.php".
const DJANGO_API_BASE_URL = API_BASE_URL.replace(/\/index\.php\/?$/, '');

const RankingRetosAdmin: React.FC = () => {
  const [nivel, setNivel] = useState<string>('');
  const [items, setItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (nivelFiltro: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = authService.getToken?.() || localStorage.getItem('token');
      if (!token) {
        setError('No se encontró token de autenticación');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (nivelFiltro) params.set('nivel', nivelFiltro);

      const url = `${DJANGO_API_BASE_URL}/gamificacion/ranking-retos/${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'No se pudo cargar el ranking de retos');
      }

      setItems((data.data || []) as RankingItem[]);
    } catch (e: any) {
      console.error('Error cargando ranking de retos:', e);
      setError(e.message || 'Error cargando ranking de retos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(nivel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivel]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>🏆 Ranking de Retos Diarios</h2>
        <p>
          Revisa qué estudiantes han completado más retos diarios y cuántos han fallado.
          Usa este panel para reconocer esfuerzo y dedicación.
        </p>
      </header>

      <div className="filters-section" style={{ marginBottom: '1.5rem' }}>
        <label style={{ marginRight: '0.5rem', fontWeight: 600 }}>Filtrar por nivel:</label>
        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los niveles</option>
          {NIVELES.filter(n => n !== '').map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-message">Cargando ranking...</div>
      ) : items.length === 0 ? (
        <div className="no-data-message">No hay datos de retos todavía.</div>
      ) : (
        <div className="table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Estudiante</th>
                <th>Email</th>
                <th>Nivel</th>
                <th>Retos completados</th>
                <th>Retos fallidos</th>
                <th>Mejor racha</th>
                <th>Dulces</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.full_name || 'Sin nombre'}</td>
                  <td>{item.email}</td>
                  <td>{item.nivel || 'N/A'}</td>
                  <td>{item.reto_completados_total}</td>
                  <td>{item.reto_fallidos_total}</td>
                  <td>{item.reto_mejor_racha}</td>
                  <td>{item.total_dulces}</td>
                  <td>{item.total_xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingRetosAdmin;
