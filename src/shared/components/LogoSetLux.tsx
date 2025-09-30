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
    <img
      src={'/Logo_SetLux_02.png'}
      alt='SetLux'
      width={size}
      height={size}
      className='object-contain bg-transparent block select-none'
      style={{ backgroundColor: 'transparent', filter: 'drop-shadow(0 0 20px rgba(37,99,235,0.25))' }}
      draggable={false}
      aria-hidden='true'
    />
  );
}
