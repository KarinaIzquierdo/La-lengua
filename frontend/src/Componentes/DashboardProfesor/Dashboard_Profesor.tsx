import React, { useState, useEffect } from 'react';
import './Dashboard_Profesor.css';
import Nav_Profesor from './Nav_Profesor';
import MisClases from './MisClases';
import ProgramarClase from './ProgramarClase';
import DriveEvaluaciones from './DriveEvaluaciones';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { ClaseService } from '../../services/claseService';
import { calificacionService } from '../../services/calificacionService';
import GestionCLB from './GestionCLB';
import MisClubs from './MisClubs';
import ReportesProgreso from './ReportesProgreso';
import NotificacionesProfesor from './NotificacionesProfesor';
import EstudiantesView from './EstudiantesView';
import HistorialAsistencias from './HistorialAsistencias';
import CalificarEvaluaciones from './CalificarEvaluaciones';
import MisionesAdmin from '../DashboardAdmin/MisionesAdmin';

interface DashboardProfesorProps {
  onLogout?: () => void;
}

export default function DashboardProfesor({ onLogout }: DashboardProfesorProps = {}) {
  const [activeView, setActiveView] = useState('clases');
  const [profesorData, setProfessorData] = useState({
    nombre: 'Cargando...',
    especialidad: 'Inglés Conversacional',
    clasesTotales: 24,
    estudiantesActivos: 18,
    evaluacionesPendientes: 5,
    initials: 'CG'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfessorData = async () => {
      try {
        // 1) Intentar leer directamente del usuario guardado en el login (localStorage)
        const savedUser = authService.getUser?.();
        if (savedUser) {
          const firstName = savedUser.first_name || '';
          const lastName = savedUser.last_name || '';
          const username = savedUser.username || '';

          const fullNameRaw = `${firstName} ${lastName}`.trim();
          const fullName = fullNameRaw || username || savedUser.email || 'Profesor';

          const initials = (
            (firstName?.charAt(0) || username?.charAt(0) || 'P') +
            (lastName?.charAt(0) || '')
          ).toUpperCase();

          setProfessorData(prev => ({
            ...prev,
            nombre: `Prof. ${fullName}`,
            initials,
          }));
        } else {
          // 2) Fallback: intentar obtener el perfil desde el backend si el endpoint existe
          const response = await userService.getCurrentUser();
          if (response.success && response.user) {
            setProfessorData(prev => ({
              ...prev,
              nombre: `Prof. ${response.user.full_name}`,
              initials: response.user.initials,
            }));
          }
        }

        try {
          const clasesProfesor: any[] = await ClaseService.getClasesPorProfesor(0);
          const clasesArray = Array.isArray(clasesProfesor) ? clasesProfesor : [];

          const estudiantesIds = new Set<number>();
          clasesArray.forEach((clase: any) => {
            const est = clase.estudiantes;
            if (Array.isArray(est)) {
              est.forEach((id: any) => {
                const parsed = typeof id === 'string' ? parseInt(id, 10) : id;
                if (!Number.isNaN(parsed)) {
                  estudiantesIds.add(parsed);
                }
              });
            } else if (typeof est === 'string') {
              est.split(',').forEach((idStr: string) => {
                const parsed = parseInt(idStr.trim(), 10);
                if (!Number.isNaN(parsed)) {
                  estudiantesIds.add(parsed);
                }
              });
            }
          });

          let evaluacionesPendientes = 0;
          try {
            const pendientes = await calificacionService.obtenerRespuestasPorCalificar();
            if (pendientes.success) {
              if (typeof pendientes.total === 'number') {
                evaluacionesPendientes = pendientes.total;
              } else if (Array.isArray(pendientes.respuestas)) {
                evaluacionesPendientes = pendientes.respuestas.length;
              }
            }
          } catch (e) {
            console.error('Error loading pending evaluations:', e);
          }

          setProfessorData(prev => ({
            ...prev,
            clasesTotales: clasesArray.length,
            estudiantesActivos: estudiantesIds.size,
            evaluacionesPendientes,
          }));
        } catch (e) {
          console.error('Error loading professor stats:', e);
        }
      } catch (error) {
        console.error('Error loading professor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfessorData();
  }, []);

  return (
    <div className="profesor-layout">
      <Nav_Profesor 
        profesorData={profesorData}
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={onLogout}
      />
      
      <div className="profesor-content">
        {/* Contenido principal según vista activa */}
        {activeView === 'dashboard' && (
          <div className="dashboard-home">
            {/* Header con estadísticas */}
            <div className="profesor-header">
              <div className="welcome-section">
                <h1>¡Bienvenido, {profesorData.nombre}! 👨‍🏫</h1>
                <p>Gestiona tus clases, evaluaciones y estudiantes desde aquí</p>
              </div>
              
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-info">
                    <span className="stat-number">{profesorData.clasesTotales}</span>
                    <span className="stat-label">Clases Totales</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <span className="stat-number">{profesorData.estudiantesActivos}</span>
                    <span className="stat-label">Estudiantes Activos</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-info">
                    <span className="stat-number">{profesorData.evaluacionesPendientes}</span>
                    <span className="stat-label">Evaluaciones Pendientes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="main-content">
          {activeView === 'clases' && <MisClases profesorId={1} />}            
          {activeView === 'programar-clase' && <ProgramarClase />}
          {activeView === 'drive-evaluaciones' && <DriveEvaluaciones />}
          {activeView === 'gestion-clb' && <GestionCLB profesorId={1} />}
          {activeView === 'mis-clubs' && <MisClubs />}
          {activeView === 'estudiantes' && <EstudiantesView />}
          {activeView === 'reportes' && <ReportesProgreso />}
          {activeView === 'misiones' && <MisionesAdmin />}
          {activeView === 'historial-asistencias' && <HistorialAsistencias />}
          {activeView === 'calificar-evaluaciones' && <CalificarEvaluaciones />}
          {activeView === 'notificaciones' && <NotificacionesProfesor />}
        </div>
      </div>
    </div>
  );
}
