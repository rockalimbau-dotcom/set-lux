import React from 'react';

interface ChipProps {
  label: string;
  colorBg: string;
  colorFg: string;
  text: string;
  badgeClassName?: string; // Clases personalizadas para el badge
}

export default function Chip({ label, colorBg, colorFg, text, badgeClassName }: ChipProps) {
  // Determinar si el código es largo (REFG, REFBB, GP, GR, etc.)
  const isLongCode = label.length > 3 || label.startsWith('REF') || label.endsWith('P') || label.endsWith('R');
  
  // Clases de ancho adaptativo (igual que en reportes)
  const defaultBadgeWidthClass = isLongCode
    ? 'min-w-[28px] sm:min-w-[32px] md:min-w-[36px] px-2 sm:px-2.5 md:px-3'
    : 'min-w-[20px] sm:min-w-[24px] md:min-w-[28px] px-1.5 sm:px-2 md:px-2.5';
  
  const badgeWidthClass = badgeClassName || defaultBadgeWidthClass;
  
  return (
    <span
      className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40'
      title={text}
    >
      <span
        className={`inline-flex items-center justify-center h-3.5 sm:h-4 md:h-5 rounded sm:rounded-md md:rounded-lg font-bold text-[8px] sm:text-[9px] md:text-[10px] ${badgeWidthClass}`}
        style={{ 
          background: colorBg, 
          color: colorFg,
          WebkitTextFillColor: colorFg,
          textFillColor: colorFg
        } as React.CSSProperties}
      >
        {label}
      </span>
      <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-200'>{text}</span>
    </span>
  );
}
