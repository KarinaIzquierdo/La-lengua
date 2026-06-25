import React, { useState, useEffect } from 'react';
import { financialService, type Plan } from '../../services/financialService';
import EditPlanModal from './EditPlanModal';
import './PlanesPrecios.css';

interface Especializacion {
  id: number;
  nombre: string;
  precio: number;
  duracion: string;
}

const PlanesPrecios: React.FC = () => {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [especializaciones, setEspecializaciones] = useState<Especializacion[]>([
    { id: 1, nombre: 'Inglés de Negocios', precio: 50000, duracion: '3 meses' },
    { id: 2, nombre: 'Preparación TOEFL', precio: 75000, duracion: '4 meses' },
    { id: 3, nombre: 'Conversación Avanzada', precio: 40000, duracion: '2 meses' },
    { id: 4, nombre: 'Inglés Técnico', precio: 60000, duracion: '3 meses' },
  ]);
  const [selectedEspecializacion, setSelectedEspecializacion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadPlanes();
  }, []);

  const loadPlanes = async () => {
    try {
      setLoading(true);
      const planesData = await financialService.getPlanes();
      setPlanes(planesData);
      setError(null);
    } catch (err) {
      console.error('Error loading planes:', err);
      setError('Error al cargar los planes');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setShowEditModal(true);
  };

  const handleTogglePlan = async (planId: number) => {
    try {
      await financialService.togglePlan(planId);
      await loadPlanes(); // Recargar planes después del toggle
    } catch (err) {
      console.error('Error toggling plan:', err);
      setError('Error al cambiar estado del plan');
    }
  };

  const handleSavePlan = async (updatedPlan: Plan) => {
    try {
      if (editingPlan) {
        await financialService.updatePlan(editingPlan.id, updatedPlan);
        await loadPlanes();
        setShowEditModal(false);
        setEditingPlan(null);
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      setError('Error al actualizar el plan');
    }
  };

  const calcularPrecioConEspecializacion = (precioBase: number, precioEspecializacion: number) => {
    return precioBase + precioEspecializacion;
  };

  const getIconoPlan = (tipo: string) => {
    switch (tipo) {
      case 'basico': return '🌱';
      case 'especializado': return '🎯';
      case 'premium': return '👑';
      default: return '📚';
    }
  };

  if (loading) {
    return (
      <div className="planes-precios-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="planes-precios-container">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={loadPlanes} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="planes-precios-container">
      <header className="page-header">
        <h2>Gestión de Planes y Precios</h2>
        <p>Administra los planes disponibles y sus precios para los estudiantes</p>
      </header>

      {/* Sección de Planes Base */}
      <section className="planes-section">
        <h3>Planes Base</h3>
        <div className="planes-grid">
          {planes.map((plan) => (
            <div 
              key={plan.id} 
              className={`plan-card ${!plan.activo ? 'inactive' : ''}`}
              style={{ '--plan-color': plan.color_tema } as React.CSSProperties}
            >
              <div className="plan-header">
                <div className="plan-icon">{getIconoPlan(plan.tipo)}</div>
                <div className="plan-info">
                  <h4>{plan.nombre}</h4>
                  <span className={`plan-badge ${plan.tipo}`}>{plan.tipo.toUpperCase()}</span>
                </div>
                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.precio_base}</span>
                  <span className="period">/mes</span>
                </div>
              </div>

              <div className="plan-content">
                <p className="plan-description">{plan.descripcion}</p>
                
                <div className="plan-features">
                  <h5>Características incluidas:</h5>
                  <ul>
                    {plan.caracteristicas.map((caracteristica, index) => (
                      <li key={index}>
                        <span className="check-icon">✓</span>
                        {caracteristica}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="plan-stats">
                  <div className="stat">
                    <span className="stat-label">DURACIÓN:</span>
                    <span className="stat-value-large">{plan.duracion_meses}</span>
                    <span className="stat-unit">mes{plan.duracion_meses > 1 ? 'es' : ''}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">ESTADO:</span>
                    <span className={`stat-badge ${plan.activo ? 'active' : 'inactive'}`}>
                      {plan.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="plan-actions">
                <button 
                  className="btn-edit-plan"
                  onClick={() => handleEditPlan(plan)}
                >
                  Editar Plan
                </button>
                <button 
                  className={`btn-toggle-plan ${plan.activo ? 'deactivate' : 'activate'}`}
                  onClick={() => handleTogglePlan(plan.id)}
                >
                  {plan.activo ? '❌ Desactivar' : '✅ Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Especializaciones */}
      <section className="especializaciones-section">
        <h3>Especializaciones Disponibles</h3>
        <div className="especializaciones-grid">
          {especializaciones.map((esp) => (
            <div key={esp.id} className="especializacion-card">
              <div className="esp-header">
                <h4>{esp.nombre}</h4>
                <div className="esp-price">
                  <span>+${esp.precio}</span>
                </div>
              </div>
              <div className="esp-content">
                <div className="esp-duration">
                  <span>📅 {esp.duracion}</span>
                </div>
                <div className="esp-calculation">
                  <h5>Precio con Plan Básico:</h5>
                  <div className="calculation">
                    <span>${planes[0]?.precio_base || 0}</span>
                    <span className="plus">+</span>
                    <span>${esp.precio}</span>
                    <span className="equals">=</span>
                    <span className="total">${calcularPrecioConEspecializacion(planes[0]?.precio_base || 0, esp.precio)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Resumen Financiero */}
      <section className="resumen-section">
        <h3>Resumen de Precios</h3>
        <div className="resumen-grid">
          <div className="resumen-card">
            <h4>💰 Ingresos Potenciales</h4>
            <div className="resumen-content">
              <div className="resumen-item">
                <span>Plan Básico (mensual):</span>
                <span className="price">${planes[0] ? Number(planes[0].precio_base).toLocaleString('es-CO') : 0}</span>
              </div>
              <div className="resumen-item">
                <span>Plan + Especialización (promedio):</span>
                <span className="price">${planes[0] ? (Number(planes[0].precio_base) + 45000).toLocaleString('es-CO') : 0}</span>
              </div>
              <div className="resumen-item">
                <span>Plan Premium:</span>
                <span className="price">${planes[2] ? Number(planes[2].precio_base).toLocaleString('es-CO') : 0}</span>
              </div>
            </div>
          </div>

          <div className="resumen-card">
            <h4>📊 Estadísticas</h4>
            <div className="resumen-content">
              <div className="resumen-item">
                <span>Planes activos:</span>
                <span className="count">{planes.filter(p => p.activo).length}</span>
              </div>
              <div className="resumen-item">
                <span>Especializaciones:</span>
                <span className="count">{especializaciones.length}</span>
              </div>
              <div className="resumen-item">
                <span>Precio promedio:</span>
                <span className="price">${((planes.reduce((sum, p) => sum + p.precio_base, 0) / planes.length) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Edición */}
      <EditPlanModal
        plan={editingPlan}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
      />
    </div>
  );
};

export default PlanesPrecios;
