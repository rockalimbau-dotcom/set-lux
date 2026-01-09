import React from 'react';
import { ParamInputProps } from '../types';

export function ParamInput({
  label,
  value,
  onChange,
  suffix,
  duo,
  type,
  readOnly = false,
}: ParamInputProps) {
  // Determinar el tipo de input: si es nocturno usa 'time', si no se especifica usa 'number' por defecto
  const inputType = type || (label.toLowerCase().includes('nocturno') ? 'time' : 'number');

  if (duo && Array.isArray(duo) && duo.length === 2) {
    return (
      <label className='space-y-0.5 sm:space-y-1'>
        <span className='block text-[10px] sm:text-xs md:text-sm text-zinc-300'>{label}</span>
        <div className='flex items-center gap-1 sm:gap-2'>
          <input
            type={inputType}
            className={`w-full px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded text-[10px] sm:text-xs md:text-sm dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 text-right ${
              readOnly ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            value={duo[0].value}
            onChange={e => !readOnly && duo[0].onChange(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder=''
          />
          <span className='text-zinc-400 text-[10px] sm:text-xs md:text-sm'>+</span>
          <input
            type={inputType}
            className={`w-full px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded text-[10px] sm:text-xs md:text-sm dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 text-right ${
              readOnly ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            value={duo[1].value}
            onChange={e => !readOnly && duo[1].onChange(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder=''
          />
          {suffix && <span className='text-zinc-400 text-[10px] sm:text-xs md:text-sm'>{suffix}</span>}
        </div>
      </label>
    );
  }

  return (
    <label className='space-y-0.5 sm:space-y-1'>
      <span className='block text-[10px] sm:text-xs md:text-sm text-zinc-300'>{label}</span>
      <div className='flex items-center gap-1 sm:gap-2'>
        <input
          type={inputType}
          className={`w-full px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded text-[10px] sm:text-xs md:text-sm dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 text-right ${
            readOnly ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          value={value || ''}
          onChange={e => !readOnly && onChange && onChange(e.target.value)}
          disabled={readOnly}
          readOnly={readOnly}
          placeholder=''
        />
        {suffix && <span className='text-zinc-400 text-[10px] sm:text-xs md:text-sm'>{suffix}</span>}
      </div>
    </label>
  );
}

