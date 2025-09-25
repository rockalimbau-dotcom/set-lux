import React from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options?: (SelectOption | string)[];
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  title?: string;
  size?: SelectSize;
}

/**
 * Select component with consistent styling and variants
 */
export default function Select({
  options = [],
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  title,
  size = 'md',
  ...rest
}: SelectProps) {
  // Base classes
  const baseClasses =
    'w-full rounded-xl border border-neutral-border bg-black/40 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

  // Size classes
  const sizeClasses: Record<SelectSize, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  // Combine all classes
  const selectClasses = `${baseClasses} ${sizeClasses[size]} ${className}`;

  // Normalize options to always have { value, label } format
  const normalizedOptions: SelectOption[] = options.map(option =>
    typeof option === 'string' ? { value: option, label: option } : option
  );

  return (
    <select
      id={id}
      name={name}
      className={selectClasses}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      title={title}
      {...rest}
    >
      {placeholder && (
        <option value='' disabled>
          {placeholder}
        </option>
      )}
      {normalizedOptions.map((option, index) => (
        <option
          key={option.value || index}
          value={option.value}
          className='bg-gray-800 text-white'
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Export sizes for easy access
export const SelectSizes: Record<string, SelectSize> = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
};
