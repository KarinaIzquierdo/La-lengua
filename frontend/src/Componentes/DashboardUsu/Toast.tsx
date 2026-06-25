import { useEffect } from "react";
import "./Toast.css";

interface ToastProps {
  isVisible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  rewards?: {
    candies?: number;
    xp?: number;
  };
  onClose: () => void;
  duration?: number;
}

export default function Toast({ 
  isVisible, 
  type, 
  title, 
  message, 
  rewards, 
  onClose, 
  duration = 4000 
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '🎉';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '🎉';
    }
  };

  return (
    <div className={`toast-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`toast toast-${type}`}>
        <div className="toast-header">
          <span className="toast-icon">{getIcon()}</span>
          <h3 className="toast-title">{title}</h3>
          <button className="toast-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="toast-content">
          <p className="toast-message">{message}</p>
          
          {rewards && (
            <div className="toast-rewards">
              {rewards.candies && (
                <div className="reward-item">
                  <span className="reward-icon">🍬</span>
                  <span className="reward-text">+{rewards.candies} dulces</span>
                </div>
              )}
              {rewards.xp && (
                <div className="reward-item">
                  <span className="reward-icon">⭐</span>
                  <span className="reward-text">+{rewards.xp} XP</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button className="toast-button" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
