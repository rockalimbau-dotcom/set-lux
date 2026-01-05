/**
 * Helper function to check if a date is Saturday (6) or Sunday (0)
 */
export function isWeekend(iso: string): boolean {
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = dt.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  } catch {
    return false;
  }
}

