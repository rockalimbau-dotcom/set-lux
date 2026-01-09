import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getRoleBadgeCode } from '@shared/constants/roles';

type ChipProps = {
  role?: string;
  name?: string;
  onRemove?: () => void;
  context?: 'prelight' | 'pickup' | string;
  readOnly?: boolean;
};

export default function Chip({ role, name, onRemove, context, readOnly = false }: ChipProps) {
  const { t } = useTranslation();
  
  // Detectar el tema actual
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Colores uniformes basados en tema: Best Boy en claro, Eléctrico en oscuro
  const roleBgColor = theme === 'light' 
    ? 'linear-gradient(135deg,#60A5FA,#0369A1)' // Color de Best Boy (más oscuro)
    : 'linear-gradient(135deg,#FDE047,#F59E0B)'; // Color de Eléctrico
  const roleFgColor = theme === 'light' ? 'white' : '#000000'; // Blanco en claro, negro en oscuro

  const base = String(role || '').toUpperCase();
  const { i18n } = useTranslation();
  let label = getRoleBadgeCode(base, i18n.language);
  if (context === 'prelight') label = `${label}P`;
  if (context === 'pickup') label = `${label}R`;
  return (
    <span className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40'>
      <span
        className='inline-flex items-center justify-center w-4 h-3.5 sm:w-5 sm:h-4 md:w-6 md:h-5 rounded sm:rounded-md font-bold text-[8px] sm:text-[9px] md:text-[10px]'
        style={{ 
          background: roleBgColor, 
          color: roleFgColor,
          WebkitTextFillColor: roleFgColor,
          textFillColor: roleFgColor
        } as React.CSSProperties}
      >
        {label || '—'}
      </span>
      <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-200'>{name || '—'}</span>
      {!readOnly && (
        <button
          onClick={onRemove}
          className='text-zinc-400 hover:text-red-500 text-[9px] sm:text-[10px] md:text-xs'
          title={t('needs.remove')}
        >
          ×
        </button>
      )}
    </span>
  );
}


