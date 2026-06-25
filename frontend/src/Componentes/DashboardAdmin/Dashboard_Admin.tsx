import { useEffect, useState } from 'react';
import StudentChart from './charts/StudentChart';
import StudentProgressChart from './charts/StudentProgressChart';
import StudentLevelDistributionChart from './charts/StudentLevelDistributionChart';
import StudentAttendanceChart from './charts/StudentAttendanceChart';
import { FaUsers, FaBook, FaDollarSign } from 'react-icons/fa';
import './admin.css';
import './GestionEstudiantes.css';
import './formulario-usuarios.css';
import { API_BASE_URL as DJANGO_API_BASE_URL } from '../../config/api';
import { authService } from '../../services/authService';

interface AdminStats {
  totalStudents: number;
  scheduledClasses: number;
  monthlyRevenue: number;
}

const Dashboard_Admin = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    scheduledClasses: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = authService.getToken?.() || localStorage.getItem('token');
        if (!token) {
          setError('No se encontró token de autenticación');
          setLoading(false);
          return;
        }

        const res = await fetch(`${DJANGO_API_BASE_URL}/admin/dashboard-stats/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          throw new Error(data.message || 'No se pudieron cargar las estadísticas');
        }

        const d = data.data || {};
        setStats({
          totalStudents: d.total_students ?? 0,
          scheduledClasses: d.scheduled_classes ?? 0,
          monthlyRevenue: d.monthly_revenue ?? 0,
        });
      } catch (e: any) {
        console.error('Error cargando estadísticas admin:', e);
        setError(e.message || 'Error cargando estadísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatCurrency = (value: number) => {
    try {
      return value.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      });
    } catch {
      return `$${value.toFixed(0)}`;
    }
  };
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Bienvenido de nuevo, Administrador</h2>
        <p>Aquí tienes un resumen de la actividad de hoy.</p>
      </header>
      {error && (
        <div className="error-message" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users"> <FaUsers /> </div>
          <div className="stat-info">
            <p>Total de Estudiantes</p>
            <span>{loading ? '...' : stats.totalStudents}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon classes"> <FaBook /> </div>
          <div className="stat-info">
            <p>Clases Programadas</p>
            <span>{loading ? '...' : stats.scheduledClasses}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon revenue"> <FaDollarSign /> </div>
          <div className="stat-info">
            <p>Ingresos del Mes</p>
            <span>{loading ? '...' : formatCurrency(stats.monthlyRevenue)}</span>
          </div>
        </div>
      </div>
      <div className="charts-section">
        <div className="chart-container">
          <h3>Análisis de Estudiantes</h3>
          <StudentChart />
        </div>
        <div className="chart-container">
          <h3>Progreso de Estudiantes por Nivel</h3>
          <StudentProgressChart />
        </div>
        <div className="chart-container">
          <h3>Distribución de Estudiantes por Nivel</h3>
          <StudentLevelDistributionChart />
        </div>
        <div className="chart-container">
          <h3>Asistencia Promedio de Estudiantes</h3>
          <StudentAttendanceChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard_Admin;
