import React from 'react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'ghost' 
  | 'export' 
  | 'export-orange' 
  | 'remove' 
  | 'duplicate';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  style?: React.CSSProperties;
}

/**
 * Button component with consistent styling and variants
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  title,
  style,
  ...rest
}: ButtonProps) {
  // Base classes
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant classes
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:
      'bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-gray-500',
    export:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-blue-500',
    'export-orange':
      'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 border border-orange-500',
    remove:
      'text-gray-400 hover:text-red-500 text-xs bg-transparent hover:bg-red-50',
    duplicate:
      'px-3 py-2 rounded-lg border text-sm border-neutral-border hover:border-orange-500 text-gray-300 hover:text-orange-500',
  };

  // Size classes
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      style={style}
      {...rest}
    >
      {loading && (
        <svg
          className='animate-spin -ml-1 mr-2 h-4 w-4'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          ></circle>
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}

// Export variants for easy access
export const ButtonVariants: Record<string, ButtonVariant> = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  GHOST: 'ghost',
  EXPORT: 'export',
  EXPORT_ORANGE: 'export-orange',
  REMOVE: 'remove',
  DUPLICATE: 'duplicate',
};

export const ButtonSizes: Record<string, ButtonSize> = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
};
