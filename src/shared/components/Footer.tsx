import React from 'react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer 
      className='w-full py-2 border-t border-neutral-border'
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div className='max-w-7xl mx-auto px-4 text-center text-xs text-zinc-400'>
        <p>
          {t('footer.copyright', { year: currentYear })}
        </p>
      </div>
    </footer>
  );
}

