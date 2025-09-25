import React from 'react';

interface LogoSetLuxProps {
  compact?: boolean;
  className?: string;
  size?: number;
}

/** Logo SetLux idéntico al de la pantalla de inicio */
export default function LogoSetLux({
  compact = false,
  className = '',
  size = 36,
}: LogoSetLuxProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid='logo-setlux'>
      <LogoIcon size={size} />
      <div className='leading-none select-none'>
        <div className='text-2xl font-extrabold tracking-tight'>
          <span style={{ color: '#296CF2' }}>Set</span>
          <span style={{ color: '#F59E0B' }}>Lux</span>
        </div>
        {!compact && (
          <div className='text-[10px] uppercase tracking-wider text-zinc-400'>
            All in One
          </div>
        )}
      </div>
    </div>
  );
}

/** Logo inline (el que te gustó): cuadrado cálido + triángulo oscuro */
function LogoIcon({ size = 80 }: { size?: number }) {
  return (
    <div
      className='rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.25)]'
      style={{ width: size, height: size }}
      aria-hidden='true'
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
}
