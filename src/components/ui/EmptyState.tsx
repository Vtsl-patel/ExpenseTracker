import React from 'react';

interface EmptyStateProps {
  icon: string;
  text: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, text }) => {
  return (
    <div className="text-center p-[40px_20px] text-ink-faint">
      <div className="text-[32px] mb-2.5">{icon}</div>
      <p className="text-[13px] text-ink-soft">{text}</p>
    </div>
  );
};
