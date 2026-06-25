import { useState, useEffect } from "react";
import "./OnboardingTour.css";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetElement: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: string;
}

interface OnboardingTourProps {
  isNewUser: boolean;
  onComplete: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "avatar",
    title: "Tu Avatar",
    description: "Aquí podrás personalizar tu avatar para acompañar a Lingo en su viaje migratorio. Elige los colores que más te gusten y hazlo único.",
    targetElement: ".avatar-card",
    position: "right",
    icon: "👤"
  },
  {
    id: "progress",
    title: "Tu Progreso",
    description: "Aquí verás tu progreso de cuántas aciertas, cuántas fallas y cómo será tu calificación. Podrás ver tu nivel actual en vocabulario, gramática y conversación.",
    targetElement: ".progress-card",
    position: "left",
    icon: "📊"
  },
  {
    id: "challenge",
    title: "Reto Diario",
    description: "Completa retos diarios para mantener tu racha activa y ganar dulces. Cada día tendrás nuevos desafíos que te ayudarán a mejorar tu inglés.",
    targetElement: ".challenge-card",
    position: "left",
    icon: "🔥"
  },
  {
    id: "missions",
    title: "Misiones Actuales",
    description: "Aquí encontrarás tus misiones de aprendizaje. Completa vocabulario, gramática y conversación para avanzar en tu viaje con Lingo.",
    targetElement: ".missions-grid",
    position: "top",
    icon: "🎯"
  }
];

export default function OnboardingTour({ isNewUser, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isNewUser) {
      setTimeout(() => {
        setIsVisible(true);
        positionCard();
      }, 1000);
    }
  }, [isNewUser]);

  useEffect(() => {
    if (isVisible) {
      positionCard();
    }
  }, [currentStep, isVisible]);

  const positionCard = () => {
    const step = onboardingSteps[currentStep];
    const targetElement = document.querySelector(step.targetElement) as HTMLElement;
    
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const cardWidth = 350;
      const cardHeight = 200;
      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'right':
          top = rect.top + (rect.height / 2) - (cardHeight / 2);
          left = rect.right + 20;
          break;
        case 'left':
          top = rect.top + (rect.height / 2) - (cardHeight / 2);
          left = rect.left - cardWidth - 20;
          break;
        case 'top':
          top = rect.top - cardHeight - 20;
          left = rect.left + (rect.width / 2) - (cardWidth / 2);
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + (rect.width / 2) - (cardWidth / 2);
          break;
      }

      // Asegurar que la card no se salga de la pantalla
      if (left < 20) left = 20;
      if (left + cardWidth > window.innerWidth - 20) left = window.innerWidth - cardWidth - 20;
      if (top < 20) top = 20;
      if (top + cardHeight > window.innerHeight - 20) top = window.innerHeight - cardHeight - 20;

      setCardPosition({ top, left });

      // Highlight del elemento target
      targetElement.classList.add('onboarding-highlight');
      
      // Remover highlight de elementos anteriores
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        if (el !== targetElement) {
          el.classList.remove('onboarding-highlight');
        }
      });
    }
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishTour = () => {
    setIsVisible(false);
    // Remover todos los highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
    onComplete();
  };

  const skipTour = () => {
    finishTour();
  };

  if (!isVisible || !isNewUser) return null;

  const step = onboardingSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="onboarding-overlay" />
      
      {/* Tarjeta de onboarding */}
      <div 
        className="onboarding-card" 
        data-step={currentStep}
      >
        <div className="onboarding-header">
          <div className="step-icon">{step.icon}</div>
          <h3>{step.title}</h3>
          <div className="step-indicator">{currentStep + 1} de {onboardingSteps.length}</div>
        </div>
        
        <div className="onboarding-content">
          <h3 className="onboarding-title">{step.title}</h3>
          <p className="onboarding-description">{step.description}</p>
        </div>
        
        <div className="onboarding-actions">
          <button 
            className="onboarding-btn onboarding-btn-skip" 
            onClick={skipTour}
          >
            Saltar tour
          </button>
          
          <div className="onboarding-navigation">
            {currentStep > 0 && (
              <button 
                className="onboarding-btn onboarding-btn-prev" 
                onClick={prevStep}
              >
                Anterior
              </button>
            )}
            
            <button 
              className="onboarding-btn onboarding-btn-next" 
              onClick={nextStep}
            >
              {currentStep === onboardingSteps.length - 1 ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </div>
        
        {/* Indicadores de progreso */}
        <div className="onboarding-progress">
          {onboardingSteps.map((_, index) => (
            <div 
              key={index}
              className={`onboarding-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
