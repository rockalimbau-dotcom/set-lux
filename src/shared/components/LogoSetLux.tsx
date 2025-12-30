import React, { useState, useEffect } from 'react';

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
  const [theme, setTheme] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    // Función para detectar cambios en el tema
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        setTheme(currentTheme);
      }
    };

    // Observar cambios en el atributo data-theme
    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    // También escuchar eventos personalizados si se emiten al cambiar el tema
    window.addEventListener('themechange', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', updateTheme);
    };
  }, []);

  const logoSrc = theme === 'light' ? '/Logo_SetLux_02_01.png' : '/Logo_SetLux_02.png';

  return (
    <img
      src={logoSrc}
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
