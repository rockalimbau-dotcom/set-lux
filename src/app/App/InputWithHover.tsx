import React, { useState } from 'react';
import Input from '@shared/components/Input.tsx';

interface InputWithHoverProps extends React.ComponentProps<typeof Input> {
  theme: 'dark' | 'light';
}

/**
 * Input component with hover state management
 */
export function InputWithHover({ theme, ...props }: InputWithHoverProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Input
      {...props}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onBlur={() => setIsHovered(false)}
      style={{
        borderWidth: isHovered ? '1.5px' : '1px',
        borderStyle: 'solid',
        borderColor: isHovered && theme === 'light' 
          ? '#0476D9' 
          : (isHovered && theme === 'dark'
            ? '#fff'
            : 'var(--border)'),
        ...props.style,
      }}
    />
  );
}

