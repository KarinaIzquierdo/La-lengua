import React from 'react';
import './ResultsModal.css';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

interface ResultsModalProps {
  isVisible: boolean;
  results: {
    type: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    timeSpent: string;
    questions: Question[];
  } | null;
  onClose: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({
  isVisible,
  results,
  onClose
}) => {
  if (!isVisible || !results) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return '¡Excelente trabajo! 🎉';
    if (score >= 80) return '¡Muy bien! 👏';
    if (score >= 70) return '¡Buen trabajo! 👍';
    if (score >= 60) return 'Puedes mejorar 💪';
    return 'Sigue practicando 📚';
  };

  return (
    <div className="results-modal-overlay">
      <div className="results-modal">
        <div className="results-header">
          <div className="results-info">
            <h2>Resultados del {results.type === 'vocabulary' ? 'Quiz de Vocabulario' : 'Evaluación de Gramática'}</h2>
            <p className="completion-message">{getScoreMessage(results.score)}</p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="score-summary">
          <div className="score-circle" style={{ borderColor: getScoreColor(results.score) }}>
            <span className="score-percentage" style={{ color: getScoreColor(results.score) }}>
              {results.score}%
            </span>
            <span className="score-label">Puntuación</span>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{results.correctAnswers}</span>
              <span className="stat-label">Correctas</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{results.totalQuestions - results.correctAnswers}</span>
              <span className="stat-label">Incorrectas</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{results.timeSpent}</span>
              <span className="stat-label">Tiempo</span>
            </div>
          </div>
        </div>

        <div className="questions-review">
          <h3>Revisión de Respuestas</h3>
          <div className="questions-list">
            {results.questions.map((question, index) => (
              <div key={question.id} className={`question-review ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="question-header">
                  <span className="question-number">#{index + 1}</span>
                  <span className={`result-icon ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                    {question.isCorrect ? '✓' : '✗'}
                  </span>
                </div>
                
                <div className="question-content">
                  <p className="question-text">{question.question}</p>
                  
                  <div className="answers-comparison">
                    <div className="answer-item">
                      <span className="answer-label">Tu respuesta:</span>
                      <span className={`answer-text ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                        {String.fromCharCode(65 + question.userAnswer)} - {question.options[question.userAnswer]}
                      </span>
                    </div>
                    
                    {!question.isCorrect && (
                      <div className="answer-item">
                        <span className="answer-label">Respuesta correcta:</span>
                        <span className="answer-text correct">
                          {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="explanation">
                    <span className="explanation-label">💡 Explicación:</span>
                    <p className="explanation-text">{question.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="results-actions">
          <button className="action-button primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;
