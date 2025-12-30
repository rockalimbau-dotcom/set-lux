import React from 'react';

interface ToggleIconButtonProps {
  isOpen: boolean;
  onClick: () => void;
  titleOpen?: string;
  titleClosed?: string;
  className?: string;
  disabled?: boolean;
}

export default function ToggleIconButton({
  isOpen,
  onClick,
  titleOpen = 'Cerrar',
  titleClosed = 'Abrir',
  className = '',
  disabled = false,
}: ToggleIconButtonProps) {
  return (
    <button
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={`no-pdf w-6 h-6 sm:w-8 sm:h-8 rounded-lg border border-neutral-border hover:border-accent ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={disabled ? 'El proyecto está cerrado' : (isOpen ? titleOpen : titleClosed)}
      type='button'
    >
      {isOpen ? '−' : '+'}
    </button>
  );
}
