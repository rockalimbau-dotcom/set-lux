import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Project } from '../types';
import { modalOverlay, modalContainer, modalButton } from '@shared/utils/tailwindClasses';

interface DeleteConfirmModalProps {
  project: Project;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ project, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useTranslation();
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

  const isLight = theme === 'light';

  return (
    <div className={modalOverlay}>
      <div className={`${modalContainer} bg-neutral-panel`}>
        <h3 className='text-lg font-semibold mb-4' style={{color: isLight ? '#0476D9' : '#F27405'}}>
          {t('common.confirmDeleteTitle')}
        </h3>
        
        <p className='text-sm mb-6' style={{color: isLight ? '#111827' : '#d1d5db'}}>
          {t('common.confirmDelete')} <strong>{project.nombre}</strong>?
        </p>

        <div className='flex justify-center gap-3'>
          <button
            onClick={onClose}
            className={modalButton}
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
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={modalButton}
            style={{
              borderColor: isLight ? '#F27405' : '#F27405',
              color: isLight ? '#F27405' : '#F27405',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
            }}
            type='button'
          >
            {t('common.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}
