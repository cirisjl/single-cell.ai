import React from 'react';

const PopUpModal = ({ isOpen, onClose, onExtend, timeLeft }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-message">
          Your session is about to expire in <strong>{Math.max(0, Math.floor(timeLeft))} seconds</strong>. Do you want to extend it?
        </p>
        <div className="modal-buttons">
          <button onClick={onExtend} className="modal-button yes">Yes</button>
          <button onClick={onClose} className="modal-button no">No</button>
        </div>
      </div>
    </div>
  );
};

export default PopUpModal;
