import React from 'react';

import LogoIcon from './LogoIcon';

interface BrandHeroProps {
  tagline?: string;
}

const BrandHero = React.memo(function BrandHero({ tagline = 'All in One' }: BrandHeroProps) {
  return (
    <div className='text-center mb-8'>
      <div className='mx-auto mb-4 grid place-items-center'>
        <LogoIcon size={120} />
      </div>
      <h1 className='text-3xl font-extrabold tracking-wide leading-tight select-none'>
        <span className='text-brand'>Set</span>
        <span className='text-[#F59E0B]'>Lux</span>
      </h1>
      <p className='mt-1 text-sm uppercase tracking-[0.18em] text-zinc-300 select-none'>
        {tagline}
      </p>
    </div>
  );
});

export default BrandHero;
