import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../../hooks/useTheme';
import { API_BASE_URL as DJANGO_API_BASE_URL } from '../../../config/api';
import { authService } from '../../../services/authService';

ChartJS.register(ArcElement, Tooltip, Legend);

interface LevelDistributionData {
  labels: string[];
  counts: number[];
}

const DEFAULT_LEVEL_DISTRIBUTION: LevelDistributionData = {
  labels: ['Básico', 'Intermedio', 'Avanzado', 'Conversación'],
  counts: [200, 250, 150, 100],
};

const StudentLevelDistributionChart = () => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';

  const [dist, setDist] = useState<LevelDistributionData>(DEFAULT_LEVEL_DISTRIBUTION);

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

        const ld = data.data?.level_distribution;
        if (ld && Array.isArray(ld.labels) && Array.isArray(ld.counts)) {
          setDist({ labels: ld.labels, counts: ld.counts });
        }
      } catch (e) {
        console.error('Error cargando StudentLevelDistributionChart:', e);
      }
    };

    loadData();
  }, []);

  const data = {
    labels: dist.labels,
    datasets: [
      {
        label: 'Número de Estudiantes',
        data: dist.counts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(253, 214, 115, 0.67)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 3,
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
        text: 'Distribución de Estudiantes por Nivel',
        color: textColor,
      },
    },
  };

  return (
    <div style={{ height: '400px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default StudentLevelDistributionChart;
