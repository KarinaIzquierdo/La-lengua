import React from 'react';
import './AchievementsModal.css';

interface Achievement {
  code: string;
  name: string;
  type?: string;
  threshold?: number;
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, achievements }) => {
  if (!isOpen) return null;

  const getIconForType = (type?: string) => {
    if (type === 'candies') return '🍬';
    if (type === 'streak') return '🔥';
    return '🏅';
  };

  const getDescription = (achievement: Achievement) => {
    if (achievement.type === 'candies' && typeof achievement.threshold === 'number') {
      return `Has conseguido al menos ${achievement.threshold} dulces.`;
    }
    if (achievement.type === 'streak' && typeof achievement.threshold === 'number') {
      return `Has alcanzado una racha de ${achievement.threshold} días.`;
    }
    return '';
  };

  return (
    <div className="achievements-modal-overlay">
      <div className="achievements-modal">
        <div className="achievements-header">
          <div className="achievements-info">
            <h2>🏅 Mis logros</h2>
            <p>Recompensas que has desbloqueado con tus dulces y tu racha diaria</p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="achievements-content">
          {achievements.length === 0 ? (
            <p className="achievements-empty">
              Aún no has desbloqueado ningún logro. Sigue completando misiones y retos diarios para conseguirlos.
            </p>
          ) : (
            <div className="achievements-grid">
              {achievements.map((achievement) => (
                <div key={achievement.code} className="achievement-card">
                  <div className="achievement-icon">
                    {getIconForType(achievement.type)}
                  </div>
                  <div className="achievement-main">
                    <h3>{achievement.name}</h3>
                    {getDescription(achievement) && (
                      <p className="achievement-description">{getDescription(achievement)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;
