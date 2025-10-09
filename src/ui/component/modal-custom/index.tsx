import React, {ReactNode, CSSProperties} from 'react';
import './index.css';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  containerStyle?: CSSProperties;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  children,
  containerStyle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container" 
        onClick={e => e.stopPropagation()}
        style={containerStyle}
      >
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default CustomModal;
