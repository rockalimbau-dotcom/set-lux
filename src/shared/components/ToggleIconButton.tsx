import React from 'react';

interface ToggleIconButtonProps {
  isOpen: boolean;
  onClick: () => void;
  titleOpen?: string;
  titleClosed?: string;
  className?: string;
}

export default function ToggleIconButton({
  isOpen,
  onClick,
  titleOpen = 'Cerrar',
  titleClosed = 'Abrir',
  className = '',
}: ToggleIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`no-pdf w-6 h-6 sm:w-8 sm:h-8 rounded-lg border border-neutral-border hover:border-accent ${className}`}
      title={isOpen ? titleOpen : titleClosed}
      type='button'
    >
      {isOpen ? '−' : '+'}
    </button>
  );
}
