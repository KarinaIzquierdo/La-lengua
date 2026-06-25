import React, { useEffect, useState } from 'react';
import './AdventureModal.css';

interface AdventureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Slide {
  id: string;
  title: string;
  image: string;
}

// IMPORTANTE: coloca estas 4 imágenes en public/Image/onboarding/
// por ejemplo:
// - public/Image/onboarding/bienvenida.png
// - public/Image/onboarding/future.png
// - public/Image/onboarding/club.png
// - public/Image/onboarding/comunidad.png
const SLIDES: Slide[] = [
  { id: 'bienvenida', title: 'Bienvenida', image: '/Image/onboarding/bienvenida.png' },
  { id: 'future', title: 'Future', image: '/Image/onboarding/future.png' },
  { id: 'club', title: 'Club', image: '/Image/onboarding/club.png' },
  { id: 'comunidad', title: 'Comunidad', image: '/Image/onboarding/comunidad.png' },
];

const AdventureModal: React.FC<AdventureModalProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        goNext();
      } else if (event.key === 'ArrowLeft') {
        goPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentIndex, onClose]);

  if (!isOpen) return null;

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  const handlePrimaryAction = () => {
    if (isLast) {
      onClose();
    } else {
      goNext();
    }
  };

  return (
    <div className="adventure-modal-overlay" onClick={onClose}>
      <div className="adventure-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="adventure-close-btn"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className="adventure-image-wrapper">
          <img
            src={slide.image}
            alt={slide.title}
            className="adventure-image"
          />
        </div>

        <div className="adventure-controls">
          <button
            type="button"
            className="adventure-secondary-btn"
            onClick={goPrev}
          >
            ← Anterior
          </button>

          <div className="adventure-dots" aria-label="Progreso de la aventura">
            {SLIDES.map((s, index) => (
              <button
                key={s.id}
                type="button"
                className={
                  'adventure-dot' + (index === currentIndex ? ' active' : '')
                }
                onClick={() => goTo(index)}
                aria-label={`Ir a la pantalla ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="adventure-primary-btn"
            onClick={handlePrimaryAction}
          >
            {isLast ? '¡Empezar!' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdventureModal;
