import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  currency?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  currency, 
  className = '', 
  id, 
  ...props 
}, ref) => {
  const inputEl = (
    <input
      id={id}
      ref={ref}
      className={`input-field ${currency ? 'pl-6 pr-3 py-2 text-right font-semibold' : ''} ${className}`}
      {...props}
    />
  );

  return (
    <div className={label ? 'mb-3.5' : 'mb-0'}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-ink-soft mb-1.5 tracking-[0.02em]">
          {label}
        </label>
      )}
      {currency ? (
        <div className="relative flex items-center">
          <span className="absolute left-3 text-xs font-semibold text-ink-faint">₹</span>
          {inputEl}
        </div>
      ) : (
        inputEl
      )}
    </div>
  );
});

Input.displayName = 'Input';
