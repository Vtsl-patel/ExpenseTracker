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
    <div
      id="toast"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-[30px] text-[13px] font-medium pointer-events-none transition-all duration-250 ease-in-out z-[200] shadow-custom bg-ink text-bg dark:bg-accent dark:text-[#1a1a1a] ${
        message ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
    >
      {message}
    </div>
  );
};
