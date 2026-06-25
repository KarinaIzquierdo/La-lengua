import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../../hooks/useTheme';
import { API_BASE_URL as DJANGO_API_BASE_URL } from '../../../config/api';
import { authService } from '../../../services/authService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LevelProgressData {
  labels: string[];
  averages: number[];
}

const DEFAULT_LEVEL_PROGRESS: LevelProgressData = {
  labels: ['Básico', 'Intermedio', 'Avanzado'],
  averages: [65, 72, 80],
};

const StudentProgressChart = () => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const [progress, setProgress] = useState<LevelProgressData>(DEFAULT_LEVEL_PROGRESS);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = authService.getToken?.() || localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${DJANGO_API_BASE_URL}/admin/dashboard-charts/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) return;

        const lp = data.data?.level_progress;
        if (lp && Array.isArray(lp.labels) && Array.isArray(lp.averages)) {
          setProgress({ labels: lp.labels, averages: lp.averages });
        }
      } catch (e) {
        console.error('Error cargando StudentProgressChart:', e);
      }
    };

    loadData();
  }, []);

  const data = {
    labels: progress.labels,
    datasets: [
      {
        label: 'Progreso promedio (%)',
        data: progress.averages,
        fill: false,
        borderColor: 'rgba(64, 255, 255, 1)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
        },
      },
      title: {
        display: true,
        text: 'Progreso Promedio de Estudiantes por Nivel',
        color: textColor,
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        ticks: {
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  return (
    <div style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default StudentProgressChart;
