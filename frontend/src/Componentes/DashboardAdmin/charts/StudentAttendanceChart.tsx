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

interface AttendanceMonthlyData {
  labels: string[];
  percentage: number[];
}

const DEFAULT_ATTENDANCE: AttendanceMonthlyData = {
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
  percentage: [90, 85, 92, 99, 95, 89],
};

const StudentAttendanceChart = () => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const [attendance, setAttendance] = useState<AttendanceMonthlyData>(DEFAULT_ATTENDANCE);

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

        const att = data.data?.attendance_monthly;
        if (att && Array.isArray(att.labels) && Array.isArray(att.percentage)) {
          setAttendance({ labels: att.labels, percentage: att.percentage });
        }
      } catch (e) {
        console.error('Error cargando StudentAttendanceChart:', e);
      }
    };

    loadData();
  }, []);

  const data = {
    labels: attendance.labels,
    datasets: [
      {
        label: 'Asistencia Promedio (%)',
        data: attendance.percentage,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
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
        text: 'Asistencia Promedio de Estudiantes',
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
        min: 0,
        max: 100,
        ticks: {
          color: textColor,
          callback: function (value: string | number) {
            return value + '%';
          },
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  return (
    <div style={{ height: '400px' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default StudentAttendanceChart;
