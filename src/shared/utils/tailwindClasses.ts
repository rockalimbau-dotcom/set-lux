/**
 * Utilidades de clases Tailwind reutilizables
 * Centraliza patrones comunes de clases para mantener consistencia
 */

/**
 * Clases para botones de exportación
 */
export const btnExport = 'px-3 py-2 rounded-lg text-sm font-semibold';

/**
 * Clases para botones de acción comunes
 */

/**
 * Clases para inputs comunes
 */
const inputBase = 'w-full rounded-xl border transition-colors duration-200 focus:outline-none';
const inputBaseWithFocus = 'w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-1';
const inputBaseWithFocusBrand = `${inputBaseWithFocus} focus:ring-brand`;

/**
 * Clases para inputs con tema
 */
const inputLight = 'bg-white text-gray-900';
const inputDark = 'bg-black/40 text-zinc-300';

/**
 * Clases para textareas comunes
 */
const textareaBase = 'w-full leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-xl bg-neutral-surface border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm transition-colors';
const textareaBaseHover = `${textareaBase} hover:border-brand/50`;
const textareaReadOnly = 'cursor-not-allowed opacity-50';

/**
 * Clases para contenedores flex comunes
 */
const flexBetween = 'flex items-center justify-between';
const flexCenter = 'flex items-center justify-center';
const flexStart = 'flex items-center justify-start';

/**
 * Clases para cards/paneles comunes
 */
const cardBase = 'rounded-2xl border border-neutral-border bg-neutral-panel/90';
const cardPadding = 'p-6';

/**
 * Clases para estados disabled
 */
const disabled = 'opacity-50 cursor-not-allowed';
const disabledInput = `${disabled} cursor-not-allowed`;

/**
 * Helper para combinar clases con estado disabled
 */
const withDisabled = (baseClasses: string, isDisabled: boolean): string => {
  return isDisabled ? `${baseClasses} ${disabled}` : baseClasses;
};

/**
 * Helper para combinar clases de input con tema
 */
const inputWithTheme = (theme: 'light' | 'dark'): string => {
  return theme === 'light' ? `${inputBase} ${inputLight}` : `${inputBase} ${inputDark}`;
};

