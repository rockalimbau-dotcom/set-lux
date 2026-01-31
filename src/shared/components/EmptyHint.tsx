import React from 'react';
import { useTranslation } from 'react-i18next';

type EmptyHintProps = {
  title: string;
  body?: string;
  subtext?: string;
};

export default function EmptyHint({ title, body, subtext }: EmptyHintProps) {
  const { t } = useTranslation();
  const bodyText = body ?? t('planning.emptyHint');
  return (
    <div className='flex flex-col items-center justify-center py-8 px-4 sm:py-12 sm:px-6 md:py-16 md:px-8 text-center'>
      <h2 className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4' style={{color: 'var(--text)'}}>
        {title}
      </h2>
      <p className='text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
        {bodyText}
      </p>
      {subtext && (
        <p className='text-[11px] sm:text-xs md:text-sm max-w-2xl mt-2' style={{color: 'var(--text)', opacity: 0.65}}>
          {subtext}
        </p>
      )}
    </div>
  );
}
