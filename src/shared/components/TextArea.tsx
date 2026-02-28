import React from 'react';

export type TextAreaVariant = 'default' | 'error';
export type TextAreaSize = 'sm' | 'md' | 'lg';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextAreaVariant;
  size?: TextAreaSize;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  title?: string;
  rows?: number;
  cols?: number;
  resize?: boolean;
}

/**
 * TextArea component with consistent styling and variants
 */
export default function TextArea({
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
  rows = 3,
  cols,
  resize = true,
  ...rest
}: TextAreaProps) {
  // Base classes
  const baseClasses =
    'w-full rounded-xl border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant classes
  const variantClasses: Record<TextAreaVariant, string> = {
    default:
      'bg-black/40 border-neutral-border text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500',
    error:
      'bg-red-50 border-red-300 text-red-900 placeholder-red-400 focus:ring-red-500 focus:border-red-500',
  };

  // Size classes
  const sizeClasses: Record<TextAreaSize, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  // Resize classes
  const resizeClasses = resize ? 'resize' : 'resize-none';

  // Combine all classes
  const textAreaClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${resizeClasses} ${className}`;

  return (
    <textarea
      id={id}
      name={name}
      className={textAreaClasses}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      title={title}
      rows={rows}
      cols={cols}
      {...rest}
    />
  );
}

// Export variants for easy access
export const TextAreaVariants: Record<string, TextAreaVariant> = {
  DEFAULT: 'default',
  ERROR: 'error',
};

export const TextAreaSizes: Record<string, TextAreaSize> = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
};
