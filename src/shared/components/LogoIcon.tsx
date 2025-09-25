import React from 'react';

interface LogoIconProps {
  size?: number;
}

const LogoIcon = React.memo(function LogoIcon({ size = 80 }: LogoIconProps) {
  return (
    <div
      className='rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.25)]'
      style={{ width: size, height: size }}
      aria-hidden='true'
      data-testid='logo-icon'
    >
      <svg
        viewBox='0 0 100 100'
        width={size}
        height={size}
        className='rounded-2xl'
      >
        <defs>
          <linearGradient id='setluxWarm' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0' stopColor='#FDE047' />
            <stop offset='1' stopColor='#F59E0B' />
          </linearGradient>
        </defs>
        <rect
          x='6'
          y='6'
          width='88'
          height='88'
          rx='22'
          fill='url(#setluxWarm)'
        />
        <polygon
          points='52,18 72,18 60,46'
          fill='rgba(0,0,0,0.72)'
          transform='rotate(10 60 32)'
        />
      </svg>
    </div>
  );
});

export default LogoIcon;
