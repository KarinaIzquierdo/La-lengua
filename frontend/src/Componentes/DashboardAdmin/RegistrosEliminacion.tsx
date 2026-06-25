import { useState, useEffect } from 'react';
import './RegistrosEliminacion.css';

const ITEMS_PER_PAGE = 20;
interface RegistroEliminacion {
  id: number;
  nombre_completo: string;
  email: string;
  username: string;
  cedula: string;
  nivel: string;
  bloque_asignado: string;
  fecha_registro: string;
  fecha_eliminacion: string;
  tiempo_registrado_str: string;
  razon: string;
  razon_display: string;
  descripcion_adicional: string;
  plan_activo: string;
  deuda_pendiente: string;
  eliminado_por: {
    id: number;
    username: string;
    nombre: string;
  } | null;
  notas: string;
}

interface Estadisticas {
  total_eliminaciones: number;
  por_razon: Record<string, { count: number; display: string }>;
  promedio_dias_registrado: number;
  total_deuda_pendiente: number;
}

export default function RegistrosEliminacion() {
  const [registros, setRegistros] = useState<RegistroEliminacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroRazon, setFiltroRazon] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [registroSeleccionado, setRegistroSeleccionado] = useState<RegistroEliminacion | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    cargarDatos();
  }, [filtroRazon, busqueda]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir URL con filtros
      let url = 'https://lalenguacolombia.co/api/index.php/registros-eliminacion/';
      const params = new URLSearchParams();
      if (filtroRazon) params.append('razon', filtroRazon);
      if (busqueda) params.append('search', busqueda);
      if (params.toString()) url += `?${params.toString()}`;

      const [registrosRes, estadisticasRes] = await Promise.all([
        fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://lalenguacolombia.co/api/index.php/registros-eliminacion/estadisticas/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const registrosData = await registrosRes.json();
      const estadisticasData = await estadisticasRes.json();

      if (registrosData.success) {
        setRegistros(registrosData.registros);
        setPaginaActual(1);
      }

      if (estadisticasData.success) {
        setEstadisticas(estadisticasData.estadisticas);
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalRegistros = registros.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / ITEMS_PER_PAGE));
  const paginaActualSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaActualSegura - 1) * ITEMS_PER_PAGE;
  const registrosPagina = registros.slice(indiceInicio, indiceInicio + ITEMS_PER_PAGE);
  const pageNumbers = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  const irAPagina = (pagina: number) => {
    const nuevaPagina = Math.max(1, Math.min(pagina, totalPaginas));
    setPaginaActual(nuevaPagina);
  };

  const irPrimera = () => irAPagina(1);
  const irUltima = () => irAPagina(totalPaginas);
  const irAnterior = () => irAPagina(paginaActualSegura - 1);
  const irSiguiente = () => irAPagina(paginaActualSegura + 1);

  if (loading) {
    return (
      <div className="registros-eliminacion-container">
        <div className="loading-registros">
          <div className="spinner"></div>
          <p>Cargando registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registros-eliminacion-container">
      <div className="registros-header">
        <h1>📋 Registros de Eliminación</h1>
        <p>Historial de estudiantes eliminados del sistema</p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{estadisticas.total_eliminaciones}</h3>
              <p>Total Eliminaciones</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{estadisticas.promedio_dias_registrado}</h3>
              <p>Promedio Días Registrado</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>${estadisticas.total_deuda_pendiente.toFixed(2)}</h3>
              <p>Deuda Total Pendiente</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-registros">
        <div className="filtro-group">
          <label>🔍 Buscar</label>
          <input
            type="text"
            placeholder="Nombre, email, cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtro-group">
          <label>📊 Filtrar por razón</label>
          <select value={filtroRazon} onChange={(e) => setFiltroRazon(e.target.value)}>
            <option value="">Todas las razones</option>
            <option value="termino_clases">Terminó sus clases</option>
            <option value="no_pago">No realizó el pago</option>
            <option value="abandono">Abandonó el curso</option>
            <option value="solicitud_propia">Solicitud del estudiante</option>
            <option value="comportamiento">Problemas de comportamiento</option>
            <option value="cambio_horario">No se adaptó al horario</option>
            <option value="otro">Otra razón</option>
          </select>
        </div>
      </div>

      {/* Lista de registros en tabla con paginación */}
      <div className="registros-table-container">
        {registros.length === 0 ? (
          <div className="no-registros">
            <p>📭 No hay registros de eliminación</p>
          </div>
        ) : (
          <>
            <table className="registros-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre completo</th>
                  <th>Email</th>
                  <th>Nivel</th>
                  <th>Bloque</th>
                  <th>Fecha registro</th>
                  <th>Fecha eliminación</th>
                  <th>Tiempo registrado</th>
                  <th>Razón</th>
                  <th>Deuda</th>
                  <th>Eliminado por</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosPagina.map((registro) => (
                  <tr key={registro.id}>
                    <td>{registro.id}</td>
                    <td>{registro.nombre_completo}</td>
                    <td>{registro.email}</td>
                    <td>{registro.nivel || 'N/A'}</td>
                    <td>{registro.bloque_asignado || 'N/A'}</td>
                    <td>{formatearFecha(registro.fecha_registro)}</td>
                    <td>{formatearFecha(registro.fecha_eliminacion)}</td>
                    <td>{registro.tiempo_registrado_str}</td>
                    <td>
                      <span className={`razon-badge razon-${registro.razon}`}>
                        {registro.razon_display}
                      </span>
                    </td>
                    <td>
                      {registro.deuda_pendiente !== '0.00'
                        ? <span className="detalle-value deuda">${registro.deuda_pendiente}</span>
                        : '—'}
                    </td>
                    <td>{registro.eliminado_por?.nombre || '—'}</td>
                    <td>
                      <button
                        className="btn-detalle-registro"
                        onClick={() => setRegistroSeleccionado(registro)}
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="paginacion-registros">
              <span className="paginacion-info">
                Mostrando {indiceInicio + 1}
                –{Math.min(indiceInicio + ITEMS_PER_PAGE, totalRegistros)} de {totalRegistros}
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
          </>
        )}
      </div>

      {/* Modal de detalles */}
      {registroSeleccionado && (
        <div className="modal-overlay-detalle" onClick={() => setRegistroSeleccionado(null)}>
          <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-detalle">
              <h2>Detalles del Registro</h2>
              <button className="btn-close-detalle" onClick={() => setRegistroSeleccionado(null)}>✕</button>
            </div>

            <div className="modal-body-detalle">
              <div className="seccion-detalle">
                <h3>👤 Información del Estudiante</h3>
                <div className="info-grid">
                  <div><strong>Nombre:</strong> {registroSeleccionado.nombre_completo}</div>
                  <div><strong>Email:</strong> {registroSeleccionado.email}</div>
                  <div><strong>Username:</strong> {registroSeleccionado.username}</div>
                  <div><strong>Cédula:</strong> {registroSeleccionado.cedula || 'N/A'}</div>
                </div>
              </div>

              <div className="seccion-detalle">
                <h3>📚 Información Académica</h3>
                <div className="info-grid">
                  <div><strong>Nivel:</strong> {registroSeleccionado.nivel || 'N/A'}</div>
                  <div><strong>Bloque:</strong> {registroSeleccionado.bloque_asignado || 'N/A'}</div>
                </div>
              </div>

              <div className="seccion-detalle">
                <h3>📅 Fechas</h3>
                <div className="info-grid">
                  <div><strong>Registro:</strong> {formatearFecha(registroSeleccionado.fecha_registro)}</div>
                  <div><strong>Eliminación:</strong> {formatearFecha(registroSeleccionado.fecha_eliminacion)}</div>
                  <div><strong>Duración:</strong> {registroSeleccionado.tiempo_registrado_str}</div>
                </div>
              </div>

              <div className="seccion-detalle">
                <h3>⚠️ Razón de Eliminación</h3>
                <div className={`razon-badge-large razon-${registroSeleccionado.razon}`}>
                  {registroSeleccionado.razon_display}
                </div>
                {registroSeleccionado.descripcion_adicional && (
                  <p className="descripcion-adicional">{registroSeleccionado.descripcion_adicional}</p>
                )}
              </div>

              {(registroSeleccionado.plan_activo || registroSeleccionado.deuda_pendiente !== '0.00') && (
                <div className="seccion-detalle">
                  <h3>💰 Información Financiera</h3>
                  <div className="info-grid">
                    {registroSeleccionado.plan_activo && (
                      <div><strong>Plan:</strong> {registroSeleccionado.plan_activo}</div>
                    )}
                    {registroSeleccionado.deuda_pendiente !== '0.00' && (
                      <div><strong>Deuda:</strong> <span className="deuda">${registroSeleccionado.deuda_pendiente}</span></div>
                    )}
                  </div>
                </div>
              )}

              {registroSeleccionado.eliminado_por && (
                <div className="seccion-detalle">
                  <h3>👨‍💼 Eliminado por</h3>
                  <p>{registroSeleccionado.eliminado_por.nombre}</p>
                </div>
              )}

              {registroSeleccionado.notas && (
                <div className="seccion-detalle">
                  <h3>📝 Notas del Administrador</h3>
                  <p className="notas-admin">{registroSeleccionado.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
