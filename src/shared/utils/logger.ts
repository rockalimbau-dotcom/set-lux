/**
 * Utilidad de logging centralizada.
 * Solo loguea en modo desarrollo para evitar ruido en producción.
 */

const isDevelopment = (): boolean => {
  try {
    return (import.meta as any).env?.DEV === true || (import.meta as any).env?.MODE === 'development';
  } catch {
    return false;
  }
};

/**
 * Log de debug (solo en desarrollo)
 */
export const debug = (...args: any[]): void => {
  if (isDevelopment()) {
    // eslint-disable-next-line no-console
    console.debug(...args);
  }
};

/**
 * Log de información (solo en desarrollo)
 */
export const log = (...args: any[]): void => {
  if (isDevelopment()) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

/**
 * Log de advertencia (siempre visible)
 */
export const warn = (...args: any[]): void => {
  // eslint-disable-next-line no-console
  console.warn(...args);
};

/**
 * Log de error (siempre visible)
 */
export const error = (...args: any[]): void => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

/**
 * Helper para crear un logger con prefijo
 */
export const createLogger = (prefix: string) => ({
  debug: (...args: any[]) => debug(`[${prefix}]`, ...args),
  log: (...args: any[]) => log(`[${prefix}]`, ...args),
  warn: (...args: any[]) => warn(`[${prefix}]`, ...args),
  error: (...args: any[]) => error(`[${prefix}]`, ...args),
});

