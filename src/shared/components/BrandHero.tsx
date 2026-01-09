import React from 'react';

import LogoIcon from './LogoIcon';

interface BrandHeroProps {
  tagline?: string;
}

const BrandHero = React.memo(function BrandHero({ tagline = 'ALL IN ONE' }: BrandHeroProps) {
  return (
    <div className='text-center mb-8 sm:mb-10 md:mb-12'>
      <div className='mx-auto mb-4 sm:mb-5 md:mb-6 grid place-items-center'>
        <LogoIcon size={80} className='sm:!w-[90px] sm:!h-[90px] md:!w-[100px] md:!h-[100px] lg:!w-[120px] lg:!h-[120px]' />
      </div>
      <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide leading-tight select-none' style={{color: 'var(--text)'}}>
        SetLux
      </h1>
      <p className='mt-3 sm:mt-4 text-sm sm:text-base md:text-lg uppercase tracking-[0.2em] select-none font-medium' style={{color: 'var(--brand)'}}>
        {tagline}
      </p>
    </div>
  );
});

export default BrandHero;
