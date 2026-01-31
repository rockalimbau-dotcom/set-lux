import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getRoleBadgeCode, applyGenderToBadge } from '@shared/constants/roles';

type ChipProps = {
  role?: string;
  name?: string;
  gender?: 'male' | 'female' | 'neutral';
  onRemove?: () => void;
  context?: 'prelight' | 'pickup' | string;
  readOnly?: boolean;
};

export default function Chip({ role, name, gender, onRemove, context, readOnly = false }: ChipProps) {
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
  
  // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), no añadir sufijo P/R
  const isRefRole = base === 'REF' || (base && base.startsWith('REF') && base.length > 3);
  if (!isRefRole) {
    if (context === 'prelight') label = `${label}P`;
    if (context === 'pickup') label = `${label}R`;
  }
  label = applyGenderToBadge(label, gender);
  
  // Determinar si el código es largo (REFG, REFBB, GP, GR, etc.)
  const isLongCode = label.length > 3 || label.startsWith('REF') || label.endsWith('P') || label.endsWith('R');
  
  // Clases de ancho adaptativo (igual que en reportes y planificación)
  const badgeWidthClass = isLongCode
    ? 'min-w-[28px] sm:min-w-[32px] md:min-w-[36px] px-2 sm:px-2.5 md:px-3'
    : 'min-w-[20px] sm:min-w-[24px] md:min-w-[28px] px-1.5 sm:px-2 md:px-2.5';
  
  return (
    <span className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-0.5 py-0.5 sm:px-1 sm:py-0.5 md:px-1.5 md:py-0.5 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40'>
      <span
        className={`inline-flex items-center justify-center h-3.5 sm:h-4 md:h-5 rounded sm:rounded-md md:rounded-lg font-bold text-[8px] sm:text-[9px] md:text-[10px] ${badgeWidthClass}`}
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


