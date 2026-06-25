import { useState, useEffect } from 'react';
import './EstadisticasAvanzadas.css';

interface EstadisticaData {
  mes: string;
  clasesImpartidas: number;
  estudiantesActivos: number;
  satisfaccion: number;
}

export default function EstadisticasAvanzadas() {
  const [estadisticas, setEstadisticas] = useState<EstadisticaData[]>([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');

  useEffect(() => {
    // Datos de ejemplo - en producción vendría de la API
    const datosEjemplo: EstadisticaData[] = [
      { mes: 'Enero', clasesImpartidas: 45, estudiantesActivos: 18, satisfaccion: 4.8 },
      { mes: 'Febrero', clasesImpartidas: 52, estudiantesActivos: 20, satisfaccion: 4.9 },
      { mes: 'Marzo', clasesImpartidas: 48, estudiantesActivos: 19, satisfaccion: 4.7 },
      { mes: 'Abril', clasesImpartidas: 55, estudiantesActivos: 22, satisfaccion: 4.9 },
      { mes: 'Mayo', clasesImpartidas: 50, estudiantesActivos: 21, satisfaccion: 4.8 },
      { mes: 'Junio', clasesImpartidas: 47, estudiantesActivos: 18, satisfaccion: 4.6 }
    ];
    setEstadisticas(datosEjemplo);
  }, []);

  const promedioClases = estadisticas.reduce((acc, curr) => acc + curr.clasesImpartidas, 0) / estadisticas.length;
  const promedioEstudiantes = estadisticas.reduce((acc, curr) => acc + curr.estudiantesActivos, 0) / estadisticas.length;
  const promedioSatisfaccion = estadisticas.reduce((acc, curr) => acc + curr.satisfaccion, 0) / estadisticas.length;

  return (
    <div className="estadisticas-avanzadas">
      <div className="estadisticas-header">
        <h2>📊 Estadísticas Avanzadas</h2>
        <div className="periodo-selector">
          <select 
            value={periodoSeleccionado} 
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            className="periodo-select"
          >
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="año">Este Año</option>
          </select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="metricas-principales">
        <div className="metrica-card">
          <div className="metrica-icon">📚</div>
          <div className="metrica-info">
            <h3>Promedio de Clases</h3>
            <span className="metrica-valor">{promedioClases.toFixed(1)}</span>
            <span className="metrica-periodo">por mes</span>
          </div>
        </div>

        <div className="metrica-card">
          <div className="metrica-icon">👥</div>
          <div className="metrica-info">
            <h3>Estudiantes Promedio</h3>
            <span className="metrica-valor">{promedioEstudiantes.toFixed(1)}</span>
            <span className="metrica-periodo">por mes</span>
          </div>
        </div>

        <div className="metrica-card">
          <div className="metrica-icon">⭐</div>
          <div className="metrica-info">
            <h3>Satisfacción Promedio</h3>
            <span className="metrica-valor">{promedioSatisfaccion.toFixed(1)}</span>
            <span className="metrica-periodo">de 5.0</span>
          </div>
        </div>
      </div>

      {/* Gráfico de rendimiento */}
      <div className="grafico-rendimiento">
        <h3>📈 Rendimiento Mensual</h3>
        <div className="grafico-container">
          <div className="grafico-barras">
            {estadisticas.map((stat, index) => (
              <div key={index} className="barra-container">
                <div 
                  className="barra-clases"
                  style={{ height: `${(stat.clasesImpartidas / 60) * 100}%` }}
                  title={`${stat.clasesImpartidas} clases`}
                ></div>
                <div 
                  className="barra-estudiantes"
                  style={{ height: `${(stat.estudiantesActivos / 25) * 100}%` }}
                  title={`${stat.estudiantesActivos} estudiantes`}
                ></div>
                <span className="barra-label">{stat.mes.substring(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className="grafico-leyenda">
            <div className="leyenda-item">
              <div className="leyenda-color clases"></div>
              <span>Clases Impartidas</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color estudiantes"></div>
              <span>Estudiantes Activos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis de satisfacción */}
      <div className="analisis-satisfaccion">
        <h3>😊 Análisis de Satisfacción</h3>
        <div className="satisfaccion-grid">
          {estadisticas.map((stat, index) => (
            <div key={index} className="satisfaccion-item">
              <span className="satisfaccion-mes">{stat.mes}</span>
              <div className="satisfaccion-estrellas">
                {[1, 2, 3, 4, 5].map((estrella) => (
                  <span 
                    key={estrella}
                    className={`estrella ${estrella <= stat.satisfaccion ? 'activa' : ''}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="satisfaccion-valor">{stat.satisfaccion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights y recomendaciones */}
      <div className="insights-section">
        <h3>💡 Insights y Recomendaciones</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Tendencia Positiva</h4>
              <p>Tus clases han aumentado un 12% en los últimos 3 meses</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">⚡</div>
            <div className="insight-content">
              <h4>Horario Óptimo</h4>
              <p>Las clases de 4-6 PM tienen la mayor satisfacción estudiantil</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Oportunidad</h4>
              <p>Considera aumentar la frecuencia de clases conversacionales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
