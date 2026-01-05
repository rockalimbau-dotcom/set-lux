import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { modalOverlay, modalContainer, modalButtonSecondary } from '@shared/utils/tailwindClasses';

interface StatusConfirmModalProps {
  projectName: string;
  isClosing: boolean; // true si se está cerrando, false si se está activando
  onClose: () => void;
  onConfirm: () => void;
}

export function StatusConfirmModal({ projectName, isClosing, onClose, onConfirm }: StatusConfirmModalProps) {
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
      <div className={modalContainer}>
        <h3 className='text-lg font-semibold mb-4' style={{color: isLight ? '#0476D9' : '#F27405'}}>
          {isClosing ? t('projectDetail.confirmClose') : t('projectDetail.confirmActivation')}
        </h3>
        
        <p 
          className='text-sm mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
          dangerouslySetInnerHTML={{
            __html: isClosing 
              ? t('projectDetail.confirmCloseMessage', { projectName })
              : t('projectDetail.confirmActivationMessage', { projectName })
          }}
        />

        <div className='flex justify-center gap-3'>
          <button
            onClick={onClose}
            className={modalButtonSecondary}
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
            className={modalButtonSecondary}
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

