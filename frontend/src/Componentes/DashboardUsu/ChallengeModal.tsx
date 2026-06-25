import { useState } from "react";
import "./ChallengeModal.css";

interface Challenge {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ChallengeModalProps {
  isOpen: boolean;
  challenge: Challenge | null;
  onClose: () => void;
  onAnswerSubmit: (selectedAnswer: number) => void;
}

export default function ChallengeModal({ isOpen, challenge, onClose, onAnswerSubmit }: ChallengeModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!isOpen || !challenge) return null;

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    
    const correct = selectedOption === challenge.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setTimeout(() => {
        onAnswerSubmit(selectedOption);
        resetModal();
      }, 2000);
    }
  };


  const resetModal = () => {
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <>
      <div className="challenge-overlay" onClick={handleClose} />
      <div className="challenge-modal">
        <div className="challenge-header">
          <h2>🔥 Daily Challenge</h2>
          <button className="challenge-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="challenge-content">
          {!showResult ? (
            <>
              <div className="challenge-question">
                <p>{challenge.question}</p>
              </div>

              <div className="challenge-options">
                {challenge.options.map((option, index) => (
                  <button
                    key={index}
                    className={`challenge-option ${selectedOption === index ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="option-text">{option}</span>
                  </button>
                ))}
              </div>

              <div className="challenge-actions">
                <button 
                  className="challenge-submit-btn"
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                >
                  Submit Answer
                </button>
              </div>
            </>
          ) : (
            <div className="challenge-result">
              <div className={`result-icon ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? '✅' : '❌'}
              </div>
              
              <h3 className={`result-title ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? '¡Correct!' : 'Incorrect'}
              </h3>
              
              <div className="result-explanation">
                <p><strong>Explanation:</strong></p>
                <p>{challenge.explanation}</p>
              </div>

              {isCorrect ? (
                <div className="success-message">
                  <p>🎉 Great job! You're maintaining your streak!</p>
                  <p>Closing in 2 seconds...</p>
                </div>
              ) : (
                <div className="challenge-actions">
                  <button className="challenge-skip-btn" onClick={() => {
                    onAnswerSubmit(selectedOption!);
                    resetModal();
                  }}>
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
