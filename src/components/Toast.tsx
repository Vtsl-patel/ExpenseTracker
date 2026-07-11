import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClear: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClear }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClear();
    }, 2200);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  return (
    <div id="toast" className={`toast ${message ? 'show' : ''}`}>
      {message}
    </div>
  );
};
