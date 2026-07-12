import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', id, onClick }) => {
  return (
    <section 
      id={id} 
      onClick={onClick} 
      className={`card ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </section>
  );
};
