import React from 'react';

export type InputVariant = 'default' | 'search' | 'error';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'date' | 'time';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  type?: InputType;
  variant?: InputVariant;
  size?: InputSize;
  placeholder?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  title?: string;
}

/**
 * Input component with consistent styling and variants
 */
export default function Input({
  type = 'text',
  variant = 'default',
  size = 'md',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  title,
  ...rest
}: InputProps) {
  // Base classes
  const baseClasses =
    'w-full rounded-xl border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant classes
  const variantClasses: Record<InputVariant, string> = {
    default:
      'bg-black/40 border-neutral-border text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500',
    search:
      'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500',
    error:
      'bg-red-50 border-red-300 text-red-900 placeholder-red-400 focus:ring-red-500 focus:border-red-500',
  };

  // Size classes
  const sizeClasses: Record<InputSize, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  // Combine all classes
  const inputClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <input
      type={type}
      id={id}
      name={name}
      className={inputClasses}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      title={title}
      {...rest}
    />
  );
}

// Export variants for easy access
export const InputVariants: Record<string, InputVariant> = {
  DEFAULT: 'default',
  SEARCH: 'search',
  ERROR: 'error',
};

export const InputSizes: Record<string, InputSize> = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
};
