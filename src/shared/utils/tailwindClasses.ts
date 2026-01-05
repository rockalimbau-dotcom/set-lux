/**
 * Utilidades de clases Tailwind reutilizables
 * Centraliza patrones comunes de clases para mantener consistencia
 */

/**
 * Clases para overlays de modales
 */
export const modalOverlay = 'fixed inset-0 bg-black/60 grid place-items-center p-4 z-50';

/**
 * Clases para contenedores de modales
 */
export const modalContainer = 'w-full max-w-md rounded-2xl border border-neutral-border p-6';
export const modalContainerLg = 'w-full max-w-lg rounded-2xl border border-neutral-border p-6';
export const modalContainerXl = 'w-full max-w-xl rounded-2xl border border-neutral-border p-6';

/**
 * Clases para botones de modales
 */
export const modalButton = 'px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]';
export const modalButtonPrimary = 'px-4 py-3 rounded-xl font-semibold text-white transition shadow-lg hover:shadow-xl';
export const modalButtonSecondary = 'inline-flex items-center justify-center px-4 py-3 rounded-xl font-semibold border transition-colors';

/**
 * Clases para botones de exportación
 */
export const btnExport = 'px-3 py-2 rounded-lg text-sm font-semibold';

/**
 * Clases para botones de acción comunes
 */
export const btnAddRole = 'px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand/80 btn-add-role';
export const btnAddRoleDisabled = `${btnAddRole} opacity-50 cursor-not-allowed`;

/**
 * Clases para inputs comunes
 */
export const inputBase = 'w-full rounded-xl border transition-colors duration-200 focus:outline-none';
export const inputBaseWithFocus = 'w-full px-3 py-2 rounded-lg border border-neutral-border focus:outline-none focus:ring-1';
export const inputBaseWithFocusBrand = `${inputBaseWithFocus} focus:ring-brand`;

/**
 * Clases para inputs con tema
 */
export const inputLight = 'bg-white text-gray-900';
export const inputDark = 'bg-black/40 text-zinc-300';

/**
 * Clases para textareas comunes
 */
export const textareaBase = 'w-full leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-xl bg-neutral-surface border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm transition-colors';
export const textareaBaseHover = `${textareaBase} hover:border-brand/50`;
export const textareaReadOnly = 'cursor-not-allowed opacity-50';

/**
 * Clases para contenedores flex comunes
 */
export const flexBetween = 'flex items-center justify-between';
export const flexCenter = 'flex items-center justify-center';
export const flexStart = 'flex items-center justify-start';

/**
 * Clases para cards/paneles comunes
 */
export const cardBase = 'rounded-2xl border border-neutral-border bg-neutral-panel/90';
export const cardPadding = 'p-6';

/**
 * Clases para estados disabled
 */
export const disabled = 'opacity-50 cursor-not-allowed';
export const disabledInput = `${disabled} cursor-not-allowed`;

/**
 * Helper para combinar clases con estado disabled
 */
export const withDisabled = (baseClasses: string, isDisabled: boolean): string => {
  return isDisabled ? `${baseClasses} ${disabled}` : baseClasses;
};

/**
 * Helper para combinar clases de input con tema
 */
export const inputWithTheme = (theme: 'light' | 'dark'): string => {
  return theme === 'light' ? `${inputBase} ${inputLight}` : `${inputBase} ${inputDark}`;
};

