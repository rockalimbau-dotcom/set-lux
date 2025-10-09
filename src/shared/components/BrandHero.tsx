import React from 'react';

import LogoIcon from './LogoIcon';

interface BrandHeroProps {
  tagline?: string;
}

const BrandHero = React.memo(function BrandHero({ tagline = 'ALL IN ONE' }: BrandHeroProps) {
  return (
    <div className='text-center mb-12'>
      <div className='mx-auto mb-6 grid place-items-center'>
        <LogoIcon size={120} />
      </div>
      <h1 className='text-6xl font-bold tracking-wide leading-tight select-none' style={{color: 'var(--text)'}}>
        SetLux
      </h1>
      <p className='mt-4 text-lg uppercase tracking-[0.2em] select-none font-medium' style={{color: 'var(--brand)'}}>
        {tagline}
      </p>
    </div>
  );
});

export default BrandHero;
