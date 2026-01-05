import { useTranslation } from 'react-i18next';
import { ROLES } from '@shared/constants/roles';

/**
 * Get translated language name
 */
export function getLanguageName(value: string, t: (key: string) => string): string {
  if (value === 'Español') return t('settings.spanish');
  if (value === 'Catalán') return t('settings.catalan');
  if (value === 'Inglés') return t('settings.english');
  return value;
}

/**
 * Get role options from ROLES constant
 */
export function getRoleOptions(): string[] {
  return Array.isArray(ROLES)
    ? ROLES.map(r => (typeof r === 'string' ? r : (r as any).label as string))
    : [];
}

/**
 * Get default role value
 */
export function getDefaultRole(): string {
  return (ROLES[0] && (typeof ROLES[0] === 'string' ? ROLES[0] : (ROLES[0] as any).label)) || '';
}

