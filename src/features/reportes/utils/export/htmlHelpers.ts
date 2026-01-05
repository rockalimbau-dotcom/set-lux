/**
 * Escape HTML special characters
 */
export const esc = (s: any): string =>
  String(s ?? '').replace(
    /[&<>]/g,
    (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
  );

