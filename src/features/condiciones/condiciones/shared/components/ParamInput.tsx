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
  // Determinar el tipo de input: si es nocturno usa 'time', si no se especifica usa 'text' para permitir comas en decimales
  const inputType = type || (label.toLowerCase().includes('nocturno') ? 'time' : 'text');

  if (duo && Array.isArray(duo) && duo.length === 2) {
    return (
      <label className='flex items-center justify-between gap-2 sm:gap-3 md:gap-4'>
        <span className='text-[10px] sm:text-xs md:text-sm text-zinc-300 dark:text-zinc-400 whitespace-nowrap flex-shrink-0 font-medium'>{label}</span>
        <div className='flex items-center gap-1 sm:gap-1.5 flex-shrink-0'>
          <input
            type={inputType}
            inputMode={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? 'decimal' : undefined}
            pattern={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? '[0-9]*[.,]?[0-9]*' : undefined}
            className={`w-[55px] sm:w-[65px] md:w-[75px] lg:w-[85px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent text-right transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
            value={duo[0].value ? String(duo[0].value).replace('.', ',') : ''}
            onChange={e => {
              if (!readOnly) {
                // Permitir comas y puntos, pero normalizar a punto al guardar
                let val = e.target.value;
                // Permitir solo números, comas y puntos
                val = val.replace(/[^\d.,-]/g, '');
                // Si tiene múltiples comas o puntos, mantener solo el último
                const lastComma = val.lastIndexOf(',');
                const lastDot = val.lastIndexOf('.');
                if (lastComma > -1 && lastDot > -1) {
                  if (lastComma > lastDot) {
                    val = val.replace(/\./g, '');
                  } else {
                    val = val.replace(/,/g, '');
                  }
                }
                // Convertir coma a punto para guardar (siempre guardar con punto)
                const normalized = val.replace(',', '.');
                // Solo actualizar si el valor cambió
                if (normalized !== duo[0].value) {
                  duo[0].onChange(normalized);
                }
              }
            }}
            onBlur={e => {
              // Asegurar que al perder el foco, el valor esté normalizado
              if (!readOnly && e.target.value) {
                let val = e.target.value.replace(/[^\d.,-]/g, '');
                const lastComma = val.lastIndexOf(',');
                const lastDot = val.lastIndexOf('.');
                if (lastComma > -1 && lastDot > -1) {
                  if (lastComma > lastDot) {
                    val = val.replace(/\./g, '');
                  } else {
                    val = val.replace(/,/g, '');
                  }
                }
                const normalized = val.replace(',', '.');
                if (normalized !== duo[0].value) {
                  duo[0].onChange(normalized);
                }
              }
            }}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder=''
          />
          <span className='text-zinc-400 text-[10px] sm:text-xs md:text-sm font-medium'>+</span>
          <input
            type={inputType}
            inputMode={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? 'decimal' : undefined}
            pattern={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? '[0-9]*[.,]?[0-9]*' : undefined}
            className={`w-[55px] sm:w-[65px] md:w-[75px] lg:w-[85px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent text-right transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
            value={duo[1].value ? String(duo[1].value).replace('.', ',') : ''}
            onChange={e => {
              if (!readOnly) {
                // Permitir comas y puntos, pero normalizar a punto al guardar
                let val = e.target.value;
                // Permitir solo números, comas y puntos
                val = val.replace(/[^\d.,-]/g, '');
                // Si tiene múltiples comas o puntos, mantener solo el último
                const lastComma = val.lastIndexOf(',');
                const lastDot = val.lastIndexOf('.');
                if (lastComma > -1 && lastDot > -1) {
                  if (lastComma > lastDot) {
                    val = val.replace(/\./g, '');
                  } else {
                    val = val.replace(/,/g, '');
                  }
                }
                // Convertir coma a punto para guardar (siempre guardar con punto)
                const normalized = val.replace(',', '.');
                // Solo actualizar si el valor cambió
                if (normalized !== duo[1].value) {
                  duo[1].onChange(normalized);
                }
              }
            }}
            onBlur={e => {
              // Asegurar que al perder el foco, el valor esté normalizado
              if (!readOnly && e.target.value) {
                let val = e.target.value.replace(/[^\d.,-]/g, '');
                const lastComma = val.lastIndexOf(',');
                const lastDot = val.lastIndexOf('.');
                if (lastComma > -1 && lastDot > -1) {
                  if (lastComma > lastDot) {
                    val = val.replace(/\./g, '');
                  } else {
                    val = val.replace(/,/g, '');
                  }
                }
                const normalized = val.replace(',', '.');
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
      <label className='flex items-center justify-between gap-2 sm:gap-3 md:gap-4'>
        <span className='text-[10px] sm:text-xs md:text-sm text-zinc-300 dark:text-zinc-400 whitespace-nowrap flex-shrink-0 font-medium'>{label}</span>
        <div className='flex items-center gap-1 sm:gap-1.5 flex-shrink-0'>
          <input
            type={inputType}
            inputMode={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? 'decimal' : undefined}
            pattern={inputType === 'text' && !label.toLowerCase().includes('nocturno') ? '[0-9]*[.,]?[0-9]*' : undefined}
            className={`w-[55px] sm:w-[65px] md:w-[75px] lg:w-[85px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md text-[10px] sm:text-xs md:text-sm bg-transparent border border-neutral-border focus:outline-none focus:ring-1 focus:ring-accent text-right transition-colors ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent'
            }`}
          value={value ? String(value).replace('.', ',') : ''}
          onChange={e => {
            if (!readOnly && onChange) {
              // Permitir comas y puntos, pero normalizar a punto al guardar
              let val = e.target.value;
              // Permitir solo números, comas y puntos
              val = val.replace(/[^\d.,]/g, '');
              // Si tiene múltiples comas o puntos, mantener solo el último
              const lastComma = val.lastIndexOf(',');
              const lastDot = val.lastIndexOf('.');
              if (lastComma > -1 && lastDot > -1) {
                if (lastComma > lastDot) {
                  val = val.replace(/\./g, '');
                } else {
                  val = val.replace(/,/g, '');
                }
              }
              // Convertir coma a punto para guardar
              const normalized = val.replace(',', '.');
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

