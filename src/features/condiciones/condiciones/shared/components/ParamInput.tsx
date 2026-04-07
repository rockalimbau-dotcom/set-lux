import React from 'react';
import { ParamInputProps } from '../types';

function formatDisplayValue(value: string | undefined, inputType: string) {
  if (!value) return '';
  return inputType === 'time' ? String(value) : String(value).replace('.', ',');
}

function normalizeInputValue(rawValue: string, inputType: string) {
  if (inputType === 'time') {
    return rawValue.replace(/[^\d:]/g, '').slice(0, 5);
  }

  let val = rawValue.replace(/[^\d.,-]/g, '');
  const lastComma = val.lastIndexOf(',');
  const lastDot = val.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      val = val.replace(/\./g, '');
    } else {
      val = val.replace(/,/g, '');
    }
  }

  return val.replace(',', '.');
}

function renderLabel(label: string, isTimeInput: boolean) {
  if (!isTimeInput) return label;

  const match = label.match(/^(.*?)(\s*\([^)]*\))$/);
  if (!match) return label;

  return (
    <>
      <span className='block'>{match[1].trim()}</span>
      <span className='mt-0.5 block text-[9px] sm:text-[10px] md:text-xs font-normal opacity-80'>
        {match[2].trim()}
      </span>
    </>
  );
}

export function ParamInput({
  label,
  value,
  onChange,
  suffix,
  duo,
  type,
  readOnly = false,
}: ParamInputProps) {
  // Determinar el tipo de input: si es nocturno usa 'time', si no se especifica usa 'text' para permitir comas en decimales
  const inputType = type || (label.toLowerCase().includes('nocturno') ? 'time' : 'text');
  const isTimeInput = inputType === 'time';
  const duoInputWidthClass =
    isTimeInput
      ? 'w-[82px] sm:w-[88px] md:w-[94px] lg:w-[100px]'
      : 'w-[55px] sm:w-[65px] md:w-[75px] lg:w-[85px]';
  const duoInputAlignClass = isTimeInput ? 'text-center tabular-nums' : 'text-right';

  if (duo && Array.isArray(duo) && duo.length === 2) {
    return (
      <label
        className={`flex items-center justify-between gap-2 sm:gap-3 md:gap-4 ${
          isTimeInput ? 'min-w-0' : ''
        }`}
      >
        <span
          className={`text-[10px] sm:text-xs md:text-sm text-zinc-300 dark:text-zinc-400 font-medium ${
            isTimeInput ? 'min-w-0 flex-1 whitespace-normal leading-tight' : 'whitespace-nowrap flex-shrink-0'
          }`}
        >
          {renderLabel(label, isTimeInput)}
        </span>
        <div
          className={`flex items-center flex-shrink-0 ${
            isTimeInput ? 'gap-1 sm:gap-1.5 md:gap-2' : 'gap-2 sm:gap-2.5'
          }`}
        >
          <input
            type={inputType}
            inputMode={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? 'decimal' : undefined}
            pattern={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? '[0-9]*[.,]?[0-9]*' : undefined}
            className={`${duoInputWidthClass} ${duoInputAlignClass} px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
            value={formatDisplayValue(duo[0].value, inputType)}
            onChange={e => {
              if (!readOnly) {
                const normalized = normalizeInputValue(e.target.value, inputType);
                if (normalized !== duo[0].value) {
                  duo[0].onChange(normalized);
                }
              }
            }}
            onBlur={e => {
              if (!readOnly && e.target.value) {
                const normalized = normalizeInputValue(e.target.value, inputType);
                if (normalized !== duo[0].value) {
                  duo[0].onChange(normalized);
                }
              }
            }}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder=''
          />
          <span className='text-zinc-400 text-xs sm:text-sm font-semibold leading-none'>+</span>
          <input
            type={inputType}
            inputMode={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? 'decimal' : undefined}
            pattern={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? '[0-9]*[.,]?[0-9]*' : undefined}
            className={`${duoInputWidthClass} ${duoInputAlignClass} px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
            value={formatDisplayValue(duo[1].value, inputType)}
            onChange={e => {
              if (!readOnly) {
                const normalized = normalizeInputValue(e.target.value, inputType);
                if (normalized !== duo[1].value) {
                  duo[1].onChange(normalized);
                }
              }
            }}
            onBlur={e => {
              if (!readOnly && e.target.value) {
                const normalized = normalizeInputValue(e.target.value, inputType);
                if (normalized !== duo[1].value) {
                  duo[1].onChange(normalized);
                }
              }
            }}
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
      <label className='flex items-center justify-between gap-2 sm:gap-3 md:gap-4' data-tutorial='conditions-price-input'>
        <span className='text-[10px] sm:text-xs md:text-sm text-zinc-300 dark:text-zinc-400 whitespace-nowrap flex-shrink-0 font-medium'>{label}</span>
        <div className='flex items-center gap-1 sm:gap-1.5 flex-shrink-0'>
          <input
            type={inputType}
            inputMode={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? 'decimal' : undefined}
            pattern={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? '[0-9]*[.,]?[0-9]*' : undefined}
            className={`w-[55px] sm:w-[65px] md:w-[75px] lg:w-[85px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent text-right transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
          value={formatDisplayValue(value, inputType)}
          onChange={e => {
            if (!readOnly && onChange) {
              const normalized = normalizeInputValue(e.target.value, inputType);
              onChange(normalized);
            }
          }}
          disabled={readOnly}
          readOnly={readOnly}
          placeholder=''
        />
        {suffix && <span className='text-zinc-400 text-[10px] sm:text-xs md:text-sm'>{suffix}</span>}
      </div>
    </label>
  );
}
