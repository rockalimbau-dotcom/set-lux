import React from 'react';
import { useTranslation } from 'react-i18next';

type EmptyHintProps = { text: string };

export default function EmptyHint({ text }: EmptyHintProps) {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
      <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
      {text}
      </h2>
      <p className='text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
        {t('planning.emptyHint')}
      </p>
    </div>
  );
}
