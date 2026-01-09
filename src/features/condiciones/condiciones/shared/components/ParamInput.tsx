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
      <label className='flex items-center justify-between gap-2 sm:gap-3 md:gap-4'>
        <span className='text-[10px] sm:text-xs md:text-sm text-zinc-300 dark:text-zinc-400 whitespace-nowrap flex-shrink-0 font-medium'>{label}</span>
        <div className='flex items-center gap-1 sm:gap-1.5 flex-shrink-0'>
          <input
            type={inputType}
            className={`w-[55px] sm:w-[65px] md:w-[75px] lg:w-[85px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-white dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent text-right transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
            style={{ backgroundColor: 'white' }}
            onMouseEnter={(e) => {
              if (!readOnly) {
                const target = e.target as HTMLInputElement;
                target.style.backgroundColor = 'white';
                target.style.background = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!readOnly) {
                const target = e.target as HTMLInputElement;
                target.style.backgroundColor = 'white';
                target.style.background = 'white';
              }
            }}
            value={duo[0].value}
            onChange={e => !readOnly && duo[0].onChange(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder=''
          />
          <span className='text-zinc-400 text-[10px] sm:text-xs md:text-sm font-medium'>+</span>
          <input
            type={inputType}
            className={`w-[55px] sm:w-[65px] md:w-[75px] lg:w-[85px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-white dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent text-right transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
            style={{ backgroundColor: 'white' }}
            onMouseEnter={(e) => {
              if (!readOnly) {
                const target = e.target as HTMLInputElement;
                target.style.backgroundColor = 'white';
                target.style.background = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!readOnly) {
                const target = e.target as HTMLInputElement;
                target.style.backgroundColor = 'white';
                target.style.background = 'white';
              }
            }}
            value={duo[1].value}
            onChange={e => !readOnly && duo[1].onChange(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder=''
          />
          {suffix && <span className='text-zinc-400 text-[10px] sm:text-xs md:text-sm font-medium ml-0.5'>{suffix}</span>}
        </div>
      </label>
    );
  }

  return (
      <label className='flex items-center justify-between gap-2 sm:gap-3 md:gap-4'>
        <span className='text-[10px] sm:text-xs md:text-sm text-zinc-300 dark:text-zinc-400 whitespace-nowrap flex-shrink-0 font-medium'>{label}</span>
        <div className='flex items-center gap-1 sm:gap-1.5 flex-shrink-0'>
          <input
            type={inputType}
            className={`w-[55px] sm:w-[65px] md:w-[75px] lg:w-[85px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-white dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent text-right transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
          style={{ backgroundColor: 'white' }}
          onMouseEnter={(e) => {
            if (!readOnly) {
              (e.target as HTMLInputElement).style.backgroundColor = 'white';
            }
          }}
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

