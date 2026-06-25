import React, { useState, useEffect } from 'react';
import { subscriptionService, type Usuario, type Plan, type Suscripcion } from '../../services/subscriptionService';
import './GestionSuscripciones.css';

const GestionSuscripciones: React.FC = () => {
  const [usuariosSinPlan, setUsuariosSinPlan] = useState<Usuario[]>([]);
  const [planesPorVencer, setPlanesPorVencer] = useState<Suscripcion[]>([]);
  const [suscripcionesActivas, setSuscripcionesActivas] = useState<Suscripcion[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [todosLosEstudiantes, setTodosLosEstudiantes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para asignar plan
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'seleccionar-estudiante' | 'asignar-plan'>('dashboard');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosData, planesVencerData, suscripcionesData, planesData, estudiantesData] = await Promise.all([
        subscriptionService.getUsuariosSinPlan(),
        subscriptionService.getPlanesPorVencer(7), // 7 días de aviso
        subscriptionService.getSuscripcionesActivas(),
        subscriptionService.getPlanes(),
        subscriptionService.getTodosLosEstudiantes()
      ]);
      
      setUsuariosSinPlan(Array.isArray(usuariosData) ? usuariosData : []);
      setPlanesPorVencer(Array.isArray(planesVencerData) ? planesVencerData : []);
      setSuscripcionesActivas(Array.isArray(suscripcionesData) ? suscripcionesData : []);
      setPlanes(Array.isArray(planesData) ? planesData : []);
      setTodosLosEstudiantes(Array.isArray(estudiantesData) ? estudiantesData : []);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarPlan = async () => {
    if (!selectedUser || !selectedPlan) return;
    
    try {
      await subscriptionService.asignarPlan({
        user_id: selectedUser.id,
        plan_id: selectedPlan,
        metodo_pago: metodoPago,
        descuento: descuento,
        notas: notas
      });
      
      // Resetear formulario y volver al dashboard
      setVistaActual('dashboard');
      setSelectedUser(null);
      setSelectedPlan(null);
      setMetodoPago('efectivo');
      setDescuento(0);
      setNotas('');
      
      // Recargar datos
      await loadData();
      
      alert('Plan asignado exitosamente');
    } catch (err) {
      console.error('Error assigning plan:', err);
      alert('Error al asignar el plan');
    }
  };

  const handleEnviarRecordatorio = async (suscripcion: Suscripcion) => {
    try {
      await subscriptionService.enviarRecordatorio(suscripcion.id);
      alert(`Recordatorio enviado a ${suscripcion.estudiante_nombre}`);
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert('Error al enviar recordatorio');
    }
  };

  const handleRenovarPlan = async (suscripcion: Suscripcion) => {
    try {
      await subscriptionService.renovarPlan(suscripcion.id);
      await loadData();
      alert(`Plan renovado para ${suscripcion.estudiante_nombre}`);
    } catch (err) {
      console.error('Error renewing plan:', err);
      alert('Error al renovar plan');
    }
  };

  const handleCancelarPlan = async (suscripcion: Suscripcion) => {
    const confirmar = window.confirm(
      `¿Estás seguro de cancelar el plan de ${suscripcion.estudiante_nombre}?\n\nEsta acción marcará la suscripción como cancelada y ya no aparecerá en suscripciones activas.`
    );
    
    if (!confirmar) return;
    
    try {
      await subscriptionService.cancelarPlan(suscripcion.id);
      
      // Pequeño delay para asegurar que el backend actualice
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recargar datos
      await loadData();
      
      alert(`Plan cancelado exitosamente para ${suscripcion.estudiante_nombre}.`);
    } catch (err) {
      console.error('Error canceling plan:', err);
      alert('Error al cancelar plan');
    }
  };

  const formatearFecha = (fecha: string | undefined) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const calcularDiasRestantes = (fechaFin: string) => {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diferencia = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  if (loading) {
    return (
      <div className="gestion-suscripciones-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando gestión de suscripciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestion-suscripciones-container">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={loadData} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Renderizar vista de selección de estudiante
  if (vistaActual === 'seleccionar-estudiante') {
    return (
      <div className="gestion-suscripciones-container">
        <header className="page-header">
          <div className="header-content">
            <div>
              <h2>Seleccionar Estudiante</h2>
              <p>Elige el estudiante al que deseas asignar un plan</p>
            </div>
            <button 
              className="btn-volver"
              onClick={() => setVistaActual('dashboard')}
            >
              ← Volver
            </button>
          </div>
        </header>

        <div className="tabla-estudiantes-container">
          {todosLosEstudiantes.length === 0 ? (
            <p>No hay estudiantes disponibles</p>
          ) : (
            <table className="tabla-estudiantes">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Fecha de Registro</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {todosLosEstudiantes.map((estudiante) => (
                  <tr key={estudiante.id}>
                    <td>
                      <div className="estudiante-nombre">
                        {estudiante.first_name} {estudiante.last_name}
                      </div>
                    </td>
                    <td>{estudiante.email}</td>
                    <td>{formatearFecha(estudiante.date_joined)}</td>
                    <td>
                      <button
                        className="btn-seleccionar-estudiante"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedUser(estudiante);
                          setVistaActual('asignar-plan');
                        }}
                      >
                        Seleccionar
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
  }

  // Renderizar vista de asignar plan
  if (vistaActual === 'asignar-plan' && selectedUser) {
    return (
      <div className="gestion-suscripciones-container">
        <header className="page-header">
          <div className="header-content">
            <div>
              <h2>Asignar Plan a {selectedUser.first_name} {selectedUser.last_name}</h2>
              <p>Completa la información del plan</p>
            </div>
            <button 
              className="btn-volver"
              onClick={() => setVistaActual('seleccionar-estudiante')}
            >
              ← Volver
            </button>
          </div>
        </header>

        <div className="formulario-asignar-plan">
          <div className="form-group">
            <label>Plan</label>
            <select 
              value={selectedPlan || ''} 
              onChange={(e) => setSelectedPlan(Number(e.target.value))}
              className="form-select"
            >
              <option value="">Seleccionar plan...</option>
              {Array.isArray(planes) && planes.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} - ${plan.precio_base.toLocaleString()} COP
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Método de Pago</label>
            <select 
              value={metodoPago} 
              onChange={(e) => setMetodoPago(e.target.value)}
              className="form-select"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="paypal">PayPal</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descuento (COP)</label>
            <input
              type="number"
              value={descuento}
              onChange={(e) => setDescuento(Number(e.target.value))}
              className="form-input"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="form-textarea"
              rows={4}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancelar"
              onClick={() => {
                setVistaActual('dashboard');
                setSelectedUser(null);
                setSelectedPlan(null);
                setMetodoPago('efectivo');
                setDescuento(0);
                setNotas('');
              }}
            >
              Cancelar
            </button>
            <button 
              className="btn-confirmar"
              onClick={handleAsignarPlan}
              disabled={!selectedPlan}
            >
              Asignar Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal del dashboard
  return (
    <div className="gestion-suscripciones-container">
      <header className="page-header">
        <div className="header-content">
          <div>
            <h2>Gestión de Suscripciones</h2>
            <p>Asigna planes, controla vencimientos y gestiona renovaciones</p>
          </div>
          <button 
            className="btn-asignar-principal"
            onClick={(e) => {
              e.preventDefault();
              setVistaActual('seleccionar-estudiante');
            }}
          >
            + Asignar Plan a Estudiante
          </button>
        </div>
      </header>

      {/* Estadísticas Rápidas */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card danger">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{planesPorVencer.length}</h3>
              <p>Planes por Vencer</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{suscripcionesActivas.length}</h3>
              <p>Suscripciones Activas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Planes por Vencer */}
      <section className="planes-vencer-section">
        <div className="section-header">
          <h3>⏰ Planes por Vencer (próximos 7 días)</h3>
          <span className="count">{planesPorVencer.length} planes</span>
        </div>
        
        {planesPorVencer.length === 0 ? (
          <div className="empty-state">
            <p>✅ No hay planes por vencer en los próximos 7 días</p>
          </div>
        ) : (
          <div className="planes-vencer-table">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Plan</th>
                  <th>Vence</th>
                  <th>Días Restantes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planesPorVencer.map((suscripcion) => {
                  const diasRestantes = calcularDiasRestantes(suscripcion.fecha_fin_plan);
                  return (
                    <tr key={suscripcion.id} className={diasRestantes <= 3 ? 'urgente' : 'warning'}>
                      <td>
                        <div className="usuario-cell">
                          <strong>{suscripcion.estudiante_nombre}</strong>
                        </div>
                      </td>
                      <td>{suscripcion.plan_nombre}</td>
                      <td>{formatearFecha(suscripcion.fecha_fin_plan)}</td>
                      <td>
                        <span className={`dias-badge ${diasRestantes <= 3 ? 'critico' : 'warning'}`}>
                          {diasRestantes} días
                        </span>
                      </td>
                      <td>
                        <div className="acciones-cell">
                          <button 
                            className="btn-recordatorio"
                            onClick={() => handleEnviarRecordatorio(suscripcion)}
                          >
                            📧 Recordatorio
                          </button>
                          <button 
                            className="btn-renovar"
                            onClick={() => handleRenovarPlan(suscripcion)}
                          >
                            🔄 Renovar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Suscripciones Activas */}
      <section className="suscripciones-activas-section">
        <div className="section-header">
          <h3>✅ Suscripciones Activas</h3>
          <span className="count">{suscripcionesActivas.length} activas</span>
        </div>
        
        <div className="suscripciones-table">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Plan</th>
                <th>Inicio</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suscripcionesActivas.slice(0, 10).map((suscripcion) => (
                <tr key={suscripcion.id}>
                  <td>{suscripcion.estudiante_nombre}</td>
                  <td>{suscripcion.plan_nombre}</td>
                  <td>{formatearFecha(suscripcion.fecha_inicio)}</td>
                  <td>{formatearFecha(suscripcion.fecha_fin)}</td>
                  <td>
                    <span className={`estado-badge ${
                      suscripcion.estado === 'activa' ? 'estado-activo' : 
                      suscripcion.estado === 'por_vencer' ? 'estado-por-vencer' : 
                      suscripcion.estado === 'cancelada' ? 'estado-cancelado' : 
                      'estado-vencido'
                    }`}>
                      {suscripcion.estado === 'activa' ? 'ACTIVO' : 
                       suscripcion.estado === 'por_vencer' ? 'POR VENCER' : 
                       suscripcion.estado === 'cancelada' ? 'CANCELADO' : 
                       'VENCIDO'}
                    </span>
                  </td>
                  <td>
                    {(suscripcion.estado === 'activa' || suscripcion.estado === 'por_vencer') && (
                      <button 
                        onClick={() => handleCancelarPlan(suscripcion)}
                        className="btn-cancelar-plan"
                        title="Cancelar plan"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};

export default GestionSuscripciones;
