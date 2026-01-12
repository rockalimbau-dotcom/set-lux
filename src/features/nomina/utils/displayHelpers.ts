/**
 * Helper function to display empty string for zero values
 */
export const displayValue = (value: number | undefined | null, decimals: number = 0): string => {
  if (value === null || value === undefined || value === 0) return '';
  // Si el valor es entero, mostrarlo sin decimales
  if (value % 1 === 0) return String(value);
  // Si tiene decimales, mostrar con el número de decimales especificado
  return decimals > 0 ? value.toFixed(decimals) : String(value);
};

/**
 * Helper function to display monetary values with € symbol
 */
export const displayMoney = (value: number | undefined | null, decimals: number = 2): string => {
  if (value === null || value === undefined || value === 0) return '';
  const formatted = value.toFixed(decimals);
  // Remove .00 if there are no meaningful decimals
  const cleaned = formatted.replace(/\.00$/, '');
  return `${cleaned}€`;
};

