import React from 'react';
import { useTranslation } from 'react-i18next';

type EmptyHintProps = { text: string };

export default function EmptyHint({ text }: EmptyHintProps) {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col items-center justify-center py-8 px-4 sm:py-12 sm:px-6 md:py-16 md:px-8 text-center'>
      <h2 className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4' style={{color: 'var(--text)'}}>
      {text}
      </h2>
      <p className='text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
        {t('planning.emptyHint')}
      </p>
    </div>
  );
}
