import React, { useState, useEffect } from 'react';
import './EvaluationModal.css';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface EvaluationModalProps {
  isVisible: boolean;
  evaluationType: string;
  onClose: () => void;
  onComplete: (results: any) => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isVisible,
  evaluationType,
  onClose,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [isCompleted, setIsCompleted] = useState(false);

  // Mock questions data
  const getQuestions = (type: string): Question[] => {
    const vocabularyQuestions: Question[] = [
      {
        id: 1,
        question: "What does 'journey' mean?",
        options: ["A short trip", "A long trip or travel", "A place to stay", "A type of food"],
        correctAnswer: 1,
        explanation: "'Journey' refers to a long trip or the act of traveling from one place to another."
      },
      {
        id: 2,
        question: "Choose the correct meaning of 'adventure':",
        options: ["A boring activity", "An exciting or dangerous experience", "A type of book", "A place to visit"],
        correctAnswer: 1,
        explanation: "'Adventure' means an exciting, unusual, or dangerous experience or activity."
      },
      {
        id: 3,
        question: "What is a 'destination'?",
        options: ["The starting point", "The place you are going to", "A type of transportation", "A travel document"],
        correctAnswer: 1,
        explanation: "'Destination' is the place to which someone or something is going or being sent."
      }
    ];

    const grammarQuestions: Question[] = [
      {
        id: 1,
        question: "Choose the correct sentence:",
        options: ["She go to school every day", "She goes to school every day", "She going to school every day", "She gone to school every day"],
        correctAnswer: 1,
        explanation: "In present simple tense with third person singular (she), we add 's' to the verb: 'goes'."
      },
      {
        id: 2,
        question: "Which sentence uses the past tense correctly?",
        options: ["I walk to the store yesterday", "I walked to the store yesterday", "I walking to the store yesterday", "I will walk to the store yesterday"],
        correctAnswer: 1,
        explanation: "For past tense of regular verbs, we add '-ed': 'walked'."
      }
    ];

    return type === 'vocabulary' ? vocabularyQuestions : grammarQuestions;
  };

  const questions = getQuestions(evaluationType);

  useEffect(() => {
    if (isVisible && timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleComplete();
    }
  }, [isVisible, timeLeft, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleComplete = () => {
    setIsCompleted(true);
    
    // Calculate results
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const results = {
      type: evaluationType,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      score: Math.round((correctCount / questions.length) * 100),
      timeSpent: formatTime(900 - timeLeft),
      questions: questions.map((q, index) => ({
        ...q,
        userAnswer: selectedAnswers[index],
        isCorrect: selectedAnswers[index] === q.correctAnswer
      }))
    };

    onComplete(results);
  };

  if (!isVisible) return null;

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="evaluation-modal-overlay">
      <div className="evaluation-modal">
        <div className="evaluation-header">
          <div className="evaluation-info">
            <h2>{evaluationType === 'vocabulary' ? 'Quiz de Vocabulario' : 'Evaluación de Gramática'}</h2>
            <div className="evaluation-meta">
              <span>Pregunta {currentQuestion + 1} de {questions.length}</span>
              <span className="timer">⏱️ {formatTime(timeLeft)}</span>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="question-container">
          <h3 className="question-text">{currentQ.question}</h3>
          
          <div className="options-container">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${selectedAnswers[currentQuestion] === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="evaluation-controls">
          <button 
            className="control-button secondary" 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            ← Anterior
          </button>
          
          <div className="question-indicators">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`question-indicator ${
                  index === currentQuestion ? 'current' : 
                  selectedAnswers[index] !== undefined ? 'answered' : ''
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>

          <button 
            className="control-button primary" 
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestion] === undefined}
          >
            {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;
