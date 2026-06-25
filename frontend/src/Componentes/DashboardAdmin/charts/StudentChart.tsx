import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StudentsMonthlyData {
  labels: string[];
  nuevo: number[];
  egresado: number[];
}

const DEFAULT_STUDENTS_MONTHLY: StudentsMonthlyData = {
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
  nuevo: [60, 19, 13, 9, 22, 31],
  egresado: [10, 20, 30, 19, 50, 60],
};

const StudentChart = () => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const [studentsMonthly, setStudentsMonthly] = useState<StudentsMonthlyData>(DEFAULT_STUDENTS_MONTHLY);

  useEffect(() => {
    const loadChartData = async () => {
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
        if (!res.ok || data.success === false) {
          return;
        }

        const s = data.data?.students_monthly;
        if (s && Array.isArray(s.labels)) {
          setStudentsMonthly({
            labels: s.labels,
            nuevo: s.new || [],
            egresado: s.removed || [],
          });
        }
      } catch (e) {
        console.error('Error cargando StudentChart:', e);
      }
    };

    loadChartData();
  }, []);

  const data = {
    labels: studentsMonthly.labels,
    datasets: [
      {
        label: 'Nuevos Estudiantes por Mes',
        data: studentsMonthly.nuevo,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
      },
      {
        label: 'Estudiantes Egresados por Mes',
        data: studentsMonthly.egresado,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
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
            color: textColor // Color del texto de la leyenda
        }
      },
      title: {
        display: true,
        text: 'Rendimiento de Estudiantes',
        color: textColor // Color del título
      },
    },
    scales: {
        x: {
            ticks: {
                color: textColor // Color del texto del eje X
            },
            grid: {
                color: gridColor // Color de las líneas de la cuadrícula X
            }
        },
        y: {
            ticks: {
                color: textColor // Color del texto del eje Y
            },
            grid: {
                color: gridColor // Color de las líneas de la cuadrícula Y
            }
        }
    }
  };

  return (
    <div style={{ height: '400px' }}>
        <Bar data={data} options={options} />
    </div>
  )
};

export default StudentChart;
