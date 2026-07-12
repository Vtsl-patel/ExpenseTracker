import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'icon';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  let cls = 'btn-primary';
  if (variant === 'ghost') cls = 'btn-ghost';
  if (variant === 'icon') cls = 'icon-btn';

  return (
    <button className={`${cls} ${className}`} {...props}>
      {children}
    </button>
  );
};
