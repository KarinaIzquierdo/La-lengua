import React, { useState, useEffect } from 'react';
import './QuizTaker.css';

interface QuizTakerProps {
  evaluacion: any;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export default function QuizTaker({ evaluacion, onClose, onComplete }: QuizTakerProps) {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutos por defecto
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Cargar preguntas del archivo subido por el profesor
  useEffect(() => {
    if (evaluacion.archivo_url) {
      loadQuestionsFromFile();
    }
  }, [evaluacion]);

  const loadQuestionsFromFile = async () => {
    setLoadingQuestions(true);
    try {
      // En una implementación real, aquí se procesaría el archivo del profesor
      // Por ahora, simulamos preguntas basadas en el contenido
      const mockQuestions = [
        {
          question: `Pregunta sobre: ${evaluacion.titulo}`,
          options: ["Opción A", "Opción B", "Opción C", "Opción D"],
          correct: 0
        },
        {
          question: `Según el material de ${evaluacion.profesor_nombre}, ¿cuál es la respuesta correcta?`,
          options: ["Primera opción", "Segunda opción", "Tercera opción", "Cuarta opción"],
          correct: 1
        },
        {
          question: `Basado en el contenido subido, selecciona la respuesta apropiada:`,
          options: ["Respuesta 1", "Respuesta 2", "Respuesta 3", "Respuesta 4"],
          correct: 2
        }
      ];
      
      setQuestions(mockQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      // Fallback a preguntas por defecto
      setQuestions([
        {
          question: "Pregunta de ejemplo del quiz",
          options: ["Opción A", "Opción B", "Opción C", "Opción D"],
          correct: 0
        }
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (!quizStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted]);

  // Detectar cuando el usuario intenta salir
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (quizStarted) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && quizStarted) {
        setShowWarning(true);
        setTimeout(() => {
          handleForceClose();
        }, 5000);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [quizStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setAnswers(new Array(questions.length).fill(''));
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex.toString();
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const score = calculateScore();
    onComplete(score);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (parseInt(answer) === questions[index].correct) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const handleTimeUp = () => {
    alert('¡Tiempo agotado! El quiz se enviará automáticamente.');
    handleSubmitQuiz();
  };

  const handleForceClose = () => {
    alert('Has salido del quiz. Se cerrará automáticamente.');
    onClose();
  };

  if (showWarning) {
    return (
      <div className="quiz-overlay">
        <div className="quiz-warning">
          <h2>⚠️ Advertencia</h2>
          <p>Has salido de la ventana del quiz. El quiz se cerrará en 5 segundos.</p>
          <p>Esta acción no se puede deshacer.</p>
        </div>
      </div>
    );
  }

  if (loadingQuestions) {
    return (
      <div className="quiz-overlay">
        <div className="quiz-container">
          <div className="quiz-header">
            <h2>📝 {evaluacion.titulo}</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="loading-questions">
            <div className="spinner"></div>
            <p>Cargando preguntas del quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="quiz-overlay">
        <div className="quiz-container">
          <div className="quiz-header">
            <h2>📝 {evaluacion.titulo}</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="quiz-instructions">
            <h3>Instrucciones del Quiz</h3>
            <ul>
              <li>⏰ Tienes {Math.floor(timeLeft / 60)} minutos para completar el quiz</li>
              <li>🔒 Solo tienes un intento</li>
              <li>⚠️ No salgas de esta ventana o el quiz se cerrará automáticamente</li>
              <li>📊 Puedes navegar entre preguntas antes de enviar</li>
              <li>✅ Asegúrate de responder todas las preguntas</li>
            </ul>
            
            <div className="quiz-info">
              <p><strong>Profesor:</strong> {evaluacion.profesor_nombre}</p>
              <p><strong>Preguntas:</strong> {questions.length}</p>
              <p><strong>Tiempo límite:</strong> {Math.floor(timeLeft / 60)} minutos</p>
            </div>
            
            <button 
              className="start-quiz-btn"
              onClick={() => setQuizStarted(true)}
              disabled={questions.length === 0}
            >
              🚀 Comenzar Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-overlay">
      <div className="quiz-container active">
        <div className="quiz-header">
          <h2>🎯 {evaluacion.titulo}</h2>
          <div className="quiz-timer">
            <span className={`timer ${timeLeft < 300 ? 'warning' : ''}`}>
              ⏰ {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            Pregunta {currentQuestion + 1} de {questions.length}
          </span>
        </div>

        <div className="quiz-content">
          <div className="question-container">
            <h3 className="question-text">
              {questions[currentQuestion].question}
            </h3>

            <div className="options-container">
              {questions[currentQuestion].options.map((option, index) => (
                <label key={index} className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={index}
                    checked={answers[currentQuestion] === index.toString()}
                    onChange={() => handleAnswerSelect(index)}
                  />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="quiz-navigation">
          <button 
            className="btn-nav" 
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
          >
            ← Anterior
          </button>

          <div className="question-indicators">
            {questions.map((_, index) => (
              <span 
                key={index}
                className={`indicator ${index === currentQuestion ? 'active' : ''} ${answers[index] ? 'answered' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </span>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button 
              className="btn-submit" 
              onClick={handleSubmitQuiz}
              disabled={answers.some(answer => !answer)}
            >
              📤 Enviar Quiz
            </button>
          ) : (
            <button 
              className="btn-nav" 
              onClick={handleNextQuestion}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
