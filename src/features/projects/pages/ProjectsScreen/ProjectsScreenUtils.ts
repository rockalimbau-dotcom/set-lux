import { useTranslation } from 'react-i18next';
import { ProjectMode } from '../../types';

/**
 * Format project mode for display
 */
export function formatMode(m: string | undefined, t: (key: string) => string): string {
  if (!m) return '—';
  const v = String(m).toLowerCase();
  if (v === 'semanal') return t('common.weekly');
  if (v === 'mensual') return t('common.monthly');
  if (v === 'publicidad') return t('common.advertising');
  return '—';
}

/**
 * Get avatar color for project
 */
export function getAvatarColor(_name: string): string {
  // Usa el color primario del tema activo
  try {
    const css = getComputedStyle(document.documentElement);
    const v = css.getPropertyValue('--brand').trim();
    if (v) return v;
  } catch {}
  const themeFallback = document.documentElement.getAttribute('data-theme') || 'dark';
  return themeFallback === 'light' ? '#0468BF' : '#f59e0b';
}

/**
 * Get condition color based on type and theme
 */
export function getConditionColor(tipo: string, isLight: boolean): string {
  const v = tipo?.toLowerCase();
  if (isLight) {
    // Tonalidades de naranja en modo claro
    if (v === 'semanal') return '#F2790F';
    if (v === 'mensual') return '#f59e0b';     // amber-500
    if (v === 'publicidad') return '#fdba74';  // orange-300
    return '#a3a3a3';
  }
  // Paleta azul en oscuro
  if (v === 'semanal') return '#1e3a8a';
  if (v === 'mensual') return '#3b82f6';
  if (v === 'publicidad') return '#60a5fa';
  return '#64748b';
}

/**
 * Get condition text color based on type and theme
 */
export function getConditionTextColor(tipo: string, isLight: boolean): string {
  const v = tipo?.toLowerCase();
  if (isLight) {
    // Para fondos claros (mensual y publicidad), usar texto negro
    if (v === 'mensual' || v === 'publicidad') return '#111827';
    // Para fondos oscuros (semanal), usar texto blanco
    return '#ffffff';
  }
  // En modo oscuro, siempre texto blanco
  return '#ffffff';
}

/**
 * Get status color based on estado and theme
 */
export function getStatusColor(estado: string): string {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const activeColor = theme === 'light' ? '#0468BF' : '#F27405';
  return estado === 'Activo' ? activeColor : '#64748b';
}

