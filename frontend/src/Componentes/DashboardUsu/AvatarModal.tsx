import React from 'react';
import './AvatarModal.css';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (src: string) => void;
}

interface AvatarOption {
  id: string;
  name: string;
  src: string;
}

// IMPORTANTE: Asegúrate de crear estos archivos de imagen en public/Image/avatars/
// por ejemplo: /public/Image/avatars/avatar-owl.png, etc.
const AVATARS: AvatarOption[] = [
  { id: 'owl', name: 'Búho lector', src: '/Image/avatars/avatar-owl.png' },
  { id: 'lion', name: 'León valiente', src: '/Image/avatars/avatar-lion.png' },
  { id: 'bee', name: 'Abejita aplicada', src: '/Image/avatars/avatar-bee.png' },
  { id: 'tiger', name: 'Gatito estudioso', src: '/Image/avatars/avatar-tiger.png' },
  { id: 'panda', name: 'Panda rojo', src: '/Image/avatars/avatar-panda.png' },
  { id: 'penguin', name: 'Pingüino profe', src: '/Image/avatars/avatar-penguin.png' },
  { id: 'duck', name: 'Patito detective', src: '/Image/avatars/avatar-duck.png' },
  { id: 'fox', name: 'Zorro gamer', src: '/Image/avatars/avatar-fox.png' },
  { id: 'frog', name: 'Rana conversadora', src: '/Image/avatars/avatar-frog.png' },
];

const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const handleSelect = (src: string) => {
    onSelect(src);
    onClose();
  };

  return (
    <div className="avatar-modal-overlay" onClick={onClose}>
      <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-modal-header">
          <div>
            <h2>Elige tu avatar</h2>
            <p>Selecciona el compañero que te acompañará en tu aventura con Lingo</p>
          </div>
          <button className="avatar-close-button" onClick={onClose}>✕</button>
        </div>

        <div className="avatar-grid">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              className="avatar-option"
              onClick={() => handleSelect(avatar.src)}
            >
              <div className="avatar-image-wrapper">
                <img src={avatar.src} alt={avatar.name} className="avatar-image" />
              </div>
              <span className="avatar-name">{avatar.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvatarModal;
