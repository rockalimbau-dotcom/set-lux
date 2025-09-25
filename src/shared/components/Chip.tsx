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
      className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'
      title={text}
    >
      <span
        className='inline-flex items-center justify-center w-6 h-5 rounded-md font-bold text-[10px]'
        style={{ background: colorBg, color: colorFg }}
      >
        {label}
      </span>
      <span className='text-xs text-zinc-200'>{text}</span>
    </span>
  );
}
