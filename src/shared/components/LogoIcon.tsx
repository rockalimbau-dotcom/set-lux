import React, { useState, useEffect } from 'react';

interface LogoIconProps {
  size?: number;
  onClick?: () => void;
  className?: string;
}

const LogoIcon = React.memo(function LogoIcon({ size = 80, onClick, className = '' }: LogoIconProps) {
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

  const logoSrc = theme === 'light' ? '/nuevologo_v3.png' : '/01_nuevo_logo_modo_oscuro.png';

  const imgElement = (
    <img
      src={logoSrc}
      alt='SetLux'
      width={size}
      height={size}
      className={`object-contain bg-transparent block select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ 
        backgroundColor: 'transparent', 
        filter: 'drop-shadow(0 0 20px rgba(37,99,235,0.25))',
        width: size,
        height: size
      }}
      draggable={false}
      aria-hidden={!onClick}
      data-testid='logo-icon'
      onClick={onClick}
    />
  );

  return imgElement;
});

export default LogoIcon;
