import React from 'react';
import './ErrorModal.css';

function ErrorModal({ error, onClose }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <p>{error}</p>
      </div>
    </div>
  );
}

export default ErrorModal;