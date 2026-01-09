import React from 'react';

interface ChipProps {
  label: string;
  colorBg: string;
  colorFg: string;
  text: string;
}

export default function Chip({ label, colorBg, colorFg, text }: ChipProps) {
  return (
    <span
      className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border border-neutral-border bg-black/40'
      title={text}
    >
      <span
        className='inline-flex items-center justify-center w-4 h-3.5 sm:w-5 sm:h-4 md:w-6 md:h-5 rounded sm:rounded-md font-bold text-[8px] sm:text-[9px] md:text-[10px]'
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
