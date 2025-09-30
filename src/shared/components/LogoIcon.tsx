import React from 'react';

interface LogoIconProps {
  size?: number;
}

const LogoIcon = React.memo(function LogoIcon({ size = 80 }: LogoIconProps) {
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
      data-testid='logo-icon'
    />
  );
});

export default LogoIcon;
