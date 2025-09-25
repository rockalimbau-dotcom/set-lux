import React from 'react';

export type TableAlign = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type TableVariant = 'default' | 'wide';

export interface ThProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  variant?: TableVariant;
}

export interface TdProps extends Omit<React.TdHTMLAttributes<HTMLTableDataCellElement>, 'align'> {
  children: React.ReactNode;
  className?: string;
  align?: 'top' | 'middle' | 'bottom';
  variant?: TableVariant;
}

export interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Table Header Cell component with consistent styling
 */
export function Th({
  children,
  className = '',
  align = 'left',
  variant = 'default',
  ...rest
}: ThProps) {
  // Base classes
  const baseClasses =
    'border border-neutral-border px-3 py-2 text-left bg-white/5 text-sm';

  // Alignment classes
  const alignClasses: Record<'left' | 'center' | 'right', string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Variant classes
  const variantClasses: Record<TableVariant, string> = {
    default: '',
    wide: 'min-w-[190px]',
  };

  // Combine all classes
  const thClasses = `${baseClasses} ${alignClasses[align]} ${variantClasses[variant]} ${className}`;

  return (
    <th className={thClasses} {...rest}>
      {children}
    </th>
  );
}

/**
 * Table Data Cell component with consistent styling
 */
export function Td({
  children,
  className = '',
  align = 'top',
  variant = 'default',
  ...rest
}: TdProps) {
  // Base classes
  const baseClasses = 'align-top border border-neutral-border px-2 py-2';

  // Alignment classes
  const alignClasses: Record<'top' | 'middle' | 'bottom', string> = {
    top: 'align-top',
    middle: 'align-middle',
    bottom: 'align-bottom',
  };

  // Variant classes
  const variantClasses: Record<TableVariant, string> = {
    default: '',
    wide: 'min-w-[190px]',
  };

  // Combine all classes
  const tdClasses = `${baseClasses} ${alignClasses[align]} ${variantClasses[variant]} ${className}`;

  return (
    <td className={tdClasses} {...rest}>
      {children}
    </td>
  );
}

/**
 * Table Row component with label and content
 */
export function Row({ label, children, className = '', ...rest }: RowProps) {
  return (
    <tr className={className} {...rest}>
      <td className='border border-neutral-border px-3 py-2 font-semibold bg-white/5 whitespace-nowrap text-sm align-top'>
        {label}
      </td>
      {children}
    </tr>
  );
}

// Export variants for easy access
export const TableAlign = {
  LEFT: 'left' as const,
  CENTER: 'center' as const,
  RIGHT: 'right' as const,
  TOP: 'top' as const,
  MIDDLE: 'middle' as const,
  BOTTOM: 'bottom' as const,
};

export const TableVariant = {
  DEFAULT: 'default' as const,
  WIDE: 'wide' as const,
};
