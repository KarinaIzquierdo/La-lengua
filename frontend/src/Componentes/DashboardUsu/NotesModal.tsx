import React, { useEffect, useState } from 'react';
import './NotesModal.css';
import { authService } from '../../services/authService';
import { evaluacionService } from '../../services/evaluacionService';
import { asistenciaService } from '../../services/asistenciaService';

interface EvaluationNote {
  id: string;
  type: string;
  title: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: string;
  status: 'completed' | 'in_progress';
  teacherComment?: string;
}

interface AsistenciaStats {
  total: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  porcentaje: number;
}

interface NotesModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ isVisible, onClose }) => {
  const [evaluationNotes, setEvaluationNotes] = useState<EvaluationNote[]>([]);
  const [asistenciaStats, setAsistenciaStats] = useState<AsistenciaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const profile = await authService.getUserProfile();
        const userId = profile.id;

        const [respuestasResp, asistenciasData] = await Promise.all([
          evaluacionService.getStudentRespuestas(),
          asistenciaService.getAsistenciasPorEstudiante(userId),
        ]);

        let respuestasList: any[] = [];
        if (Array.isArray(respuestasResp)) {
          respuestasList = respuestasResp;
        } else if (respuestasResp && Array.isArray(respuestasResp.data)) {
          respuestasList = respuestasResp.data;
        }

        const notas: EvaluationNote[] = respuestasList.map((resp: any) => {
          const calificacion = resp.calificacion != null ? Number(resp.calificacion) : 0;
          const fechaBase = resp.fecha_calificacion || resp.fecha_envio || new Date().toISOString();

          return {
            id: String(resp.id),
            type: resp.evaluacion_tipo || 'evaluacion',
            title: resp.evaluacion_titulo || 'Evaluación',
            date: fechaBase,
            score: Math.round(calificacion),
            totalQuestions: 0,
            correctAnswers: 0,
            timeSpent: resp.tiempo_gastado ? `${Math.round(resp.tiempo_gastado / 60)} min` : '--',
            status: resp.completado ? (resp.calificacion != null ? 'completed' : 'in_progress') : 'in_progress',
            teacherComment: resp.comentarios_profesor || '',
          };
        });

        setEvaluationNotes(notas);

        const asistenciasList = Array.isArray(asistenciasData) ? asistenciasData : [];
        const total = asistenciasList.length;
        const presentes = asistenciasList.filter((a: any) => a.estado === 'presente').length;
        const ausentes = asistenciasList.filter((a: any) => a.estado === 'ausente').length;
        const tardanzas = asistenciasList.filter((a: any) => a.estado === 'tardanza').length;
        const justificados = asistenciasList.filter((a: any) => a.estado === 'justificado').length;
        const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

        setAsistenciaStats({ total, presentes, ausentes, tardanzas, justificados, porcentaje });
      } catch (err) {
        console.error('Error cargando notas y asistencia:', err);
        setError('No se pudieron cargar tus notas y tu asistencia. Intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isVisible]);

  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vocabulary': return '📚';
      case 'grammar': return '✏️';
      case 'comprehension': return '🎧';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const averageScore = evaluationNotes.length
    ? Math.round(
        evaluationNotes.reduce((sum, note) => sum + (note.score || 0), 0) /
          evaluationNotes.length
      )
    : 0;

  const bestScore = evaluationNotes.length
    ? Math.max(...evaluationNotes.map((note) => note.score || 0))
    : 0;

  return (
    <div className="notes-modal-overlay">
      <div className="notes-modal">
        <div className="notes-header">
          <div className="notes-info">
            <h2>📝 Notas de Evaluaciones</h2>
            <p>Historial completo de tus evaluaciones y quizzes</p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="notes-summary">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <span className="summary-number">{evaluationNotes.length}</span>
              <span className="summary-label">Evaluaciones</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <span className="summary-number" style={{ color: getScoreColor(averageScore) }}>
                {averageScore}%
              </span>
              <span className="summary-label">Promedio</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📚</div>
            <div className="summary-content">
              <span className="summary-number">
                {asistenciaStats ? `${asistenciaStats.porcentaje}%` : '--'}
              </span>
              <span className="summary-label">Asistencia</span>
            </div>
          </div>
        </div>

        <div className="notes-content">
          <h3>Historial de Evaluaciones</h3>
          {loading && (
            <p>Cargando tus notas...</p>
          )}
          {!loading && error && (
            <p>{error}</p>
          )}
          {!loading && !error && evaluationNotes.length === 0 && (
            <p>Aún no tienes evaluaciones registradas.</p>
          )}
          {!loading && !error && evaluationNotes.length > 0 && (
            <div className="notes-list">
              {evaluationNotes.map((note) => (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <div className="note-title-section">
                      <span className="note-icon">{getTypeIcon(note.type)}</span>
                      <div className="note-title-info">
                        <h4>{note.title}</h4>
                        <span className="note-date">{formatDate(note.date)}</span>
                      </div>
                    </div>
                    <div
                      className="note-score"
                      style={{ color: getScoreColor(note.score) }}
                    >
                      {note.score ? `${note.score}%` : 'Sin nota'}
                    </div>
                  </div>

                  <div className="note-details">
                    <div className="note-stat">
                      <span className="stat-label">Estado:</span>
                      <span className={`stat-badge ${note.status}`}>
                        {note.status === 'completed' ? 'Completado' : 'En Progreso'}
                      </span>
                    </div>
                    <div className="note-comment">
                      <span className="stat-label">Comentario del profesor:</span>
                      <p className="comment-text">
                        {note.teacherComment && note.teacherComment.trim() !== ''
                          ? note.teacherComment
                          : 'Aún no hay comentario del profesor.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {asistenciaStats && (
            <div style={{ marginTop: '32px' }}>
              <h3>Asistencia a Clases</h3>
              <p>
                Has asistido a {asistenciaStats.presentes} de {asistenciaStats.total} clases
                ({asistenciaStats.porcentaje}%).
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NotesModal;
