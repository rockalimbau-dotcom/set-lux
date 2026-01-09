import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from './useTheme';

interface DietasRemoveModalProps {
  itemToRemove: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DietasRemoveModal({
  itemToRemove,
  onCancel,
  onConfirm,
}: DietasRemoveModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isLight = theme === 'light';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-6 sm:p-6 md:p-6 z-50 overflow-y-auto'>
      <div 
        className='w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-xs xl:max-w-sm 2xl:max-w-md rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 2xl:p-6 my-auto max-h-[75vh] sm:max-h-[80vh] overflow-y-auto'
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--panel)'
        }}
      >
        <h3 
          className='text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4' 
          style={{
            color: isLight ? '#0476D9' : '#F27405'
          }}
        >
          Confirmar eliminación
        </h3>
        
        <p 
          className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
        >
          ¿Estás seguro de eliminar <strong>{itemToRemove}</strong>?
        </p>

        <div className='flex justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3'>
          <button
            onClick={onCancel}
            className='inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border transition text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: 'var(--border)',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
              color: isLight ? '#111827' : '#d1d5db'
            }}
            type='button'
          >
            {t('common.no')}
          </button>
          <button
            onClick={onConfirm}
            className='inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border transition text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: isLight ? '#F27405' : '#F27405',
              color: isLight ? '#F27405' : '#F27405',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
            }}
            type='button'
          >
            Sí
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

