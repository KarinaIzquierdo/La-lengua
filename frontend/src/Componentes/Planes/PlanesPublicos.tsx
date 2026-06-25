import React, { useEffect, useState } from 'react';
import Header from '../Layout/Encabezado';
import Footer from '../Layout/PiePagina';
import type { Plan } from '../../services/financialService';
import './PlanesPublicos.css';

const PHP_API_BASE_URL = 'https://lalenguacolombia.co/api/index.php';

export default function PlanesPublicos() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlanes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${PHP_API_BASE_URL}/planes/public/`);
        if (!response.ok) {
          throw new Error(`Error al obtener planes públicos: ${response.status}`);
        }

        const json: any = await response.json();
        const data: Plan[] = Array.isArray(json?.data) ? json.data : [];
        const activos = (data || []).filter((plan) => plan.activo);
        setPlanes(activos);
        setError(null);
      } catch (e) {
        console.error('Error cargando planes públicos:', e);
        setError('No pudimos cargar los planes en este momento. Intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadPlanes();
  }, []);

  const handleLoginClick = () => {
    const event = new CustomEvent('openLoginModal');
    window.dispatchEvent(event);
  };

  const getIconoPlan = (tipo: Plan['tipo']) => {
    switch (tipo) {
      case 'basico':
        return '🌱';
      case 'especializado':
        return '🎯';
      case 'premium':
        return '👑';
      default:
        return '📚';
    }
  };

  const handleContactWhatsApp = (plan: Plan) => {
    const text = encodeURIComponent(
      `Hola, me interesa el plan ${plan.nombre} de La Lengua.\n\nMi nombre es [escribe tu nombre] y quiero más información.`
    );
    window.open(`https://wa.me/573164844819?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="planes-publicos-container">
        <Header onLoginClick={handleLoginClick} />
        <main className="planes-main">
          <section className="planes-hero">
            <h1>Planes de La Lengua</h1>
            <p>Estamos cargando la información de los planes disponibles...</p>
          </section>
          <div className="planes-loading">Cargando planes...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="planes-publicos-container">
        <Header onLoginClick={handleLoginClick} />
        <main className="planes-main">
          <section className="planes-hero">
            <h1>Planes de La Lengua</h1>
            <p>Conoce nuestras opciones de estudio y elige la que mejor se adapte a ti.</p>
          </section>
          <div className="planes-error">
            <p>{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="planes-publicos-container">
      <Header onLoginClick={handleLoginClick} />
      <main className="planes-main">
        <section className="planes-hero">
          <h1>Planes de La Lengua</h1>
          <p>
            Estos son los planes que tenemos actualmente activos en La Lengua. Elige el que mejor
            se ajuste a tu objetivo y contáctanos para empezar.
          </p>
        </section>

        <section className="planes-grid-section">
          <div className="planes-grid">
            {planes.map((plan) => (
              <article key={plan.id} className="plan-card-public">
                <div className="plan-card-header">
                  <div className="plan-card-icon">{getIconoPlan(plan.tipo)}</div>
                  <div className="plan-card-info">
                    <h2>{plan.nombre}</h2>
                    <span className={`plan-card-badge ${plan.tipo}`}>
                      {plan.tipo.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="plan-card-price">
                  <span className="currency">$</span>
                  <span className="amount">{Number(plan.precio_base).toLocaleString('es-CO')}</span>
                  <span className="period">/mes</span>
                </div>

                <p className="plan-card-description">{plan.descripcion}</p>

                <ul className="plan-card-features">
                  {plan.caracteristicas.map((caracteristica, index) => (
                    <li key={index}>
                      <span className="check-icon">✓</span>
                      {caracteristica}
                    </li>
                  ))}
                </ul>

                <div className="plan-card-footer">
                  <span className="plan-duration">
                    {plan.duracion_meses} mes{plan.duracion_meses > 1 ? 'es' : ''}
                  </span>
                  <button
                    className="plan-contact-button"
                    onClick={() => handleContactWhatsApp(plan)}
                  >
                    Quiero este plan
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
