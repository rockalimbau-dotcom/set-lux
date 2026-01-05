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
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div 
        className='w-full max-w-md rounded-2xl border border-neutral-border p-6'
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--panel)'
        }}
      >
        <h3 
          className='text-lg font-semibold mb-4' 
          style={{
            color: isLight ? '#0476D9' : '#F27405'
          }}
        >
          Confirmar eliminación
        </h3>
        
        <p 
          className='text-sm mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
        >
          ¿Estás seguro de eliminar <strong>{itemToRemove}</strong>?
        </p>

        <div className='flex justify-center gap-3'>
          <button
            onClick={onCancel}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
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
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
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

