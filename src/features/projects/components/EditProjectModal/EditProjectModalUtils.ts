import { ProjectMode } from '../../types';
import { COUNTRIES, REGIONS } from '@shared/constants/countries';

/**
 * Formatea el modo del proyecto
 */
export function formatMode(m: string | undefined): ProjectMode {
  const v = String(m || '').toLowerCase();
  if (v === 'semanal') return 'semanal';
  if (v === 'mensual') return 'mensual';
  if (v === 'diario') return 'diario';
  return 'semanal';
}

/**
 * Obtiene el label del estado
 */
export function getEstadoLabel(estado: string, t: (key: string) => string): string {
  return estado === 'Activo' ? t('common.active') : t('common.closed');
}

/**
 * Obtiene el label del tipo de condiciones
 */
export function getCondicionesLabel(
  condicionesTipo: string,
  t: (key: string) => string
): string {
  if (condicionesTipo === 'mensual') return t('common.monthly');
  if (condicionesTipo === 'semanal') return t('common.weekly');
  return t('common.advertising');
}

/**
 * Obtiene el label del país
 */
export function getPaisLabel(country: string): string {
  return COUNTRIES.find(c => c.code === country)?.name || 'España';
}

/**
 * Obtiene el label de la región
 */
export function getRegionLabel(
  country: string,
  region: string,
  t: (key: string) => string
): string {
  if (!region) return t('common.noSpecificRegion');
  const regionData = REGIONS[country as keyof typeof REGIONS]?.find(r => r.code === region);
  return regionData?.name || t('common.noSpecificRegion');
}

/**
 * Obtiene el color de foco según el tema
 */
export function getFocusColor(theme: 'light' | 'dark'): string {
  return theme === 'light' ? '#0476D9' : '#F27405';
}

/**
 * Obtiene los estilos del borde para inputs/dropdowns
 */
export function getBorderStyles(
  isHovered: boolean,
  theme: 'light' | 'dark'
): React.CSSProperties {
  return {
    borderWidth: isHovered ? '1.5px' : '1px',
    borderStyle: 'solid',
    borderColor: isHovered && theme === 'light'
      ? '#0476D9'
      : isHovered && theme === 'dark'
        ? '#fff'
        : 'var(--border)',
  };
}

/**
 * Obtiene el color de fondo del hover según el tema
 */
export function getHoverBackgroundColor(theme: 'light' | 'dark', focusColor: string): string {
  return theme === 'light' ? '#A0D3F2' : focusColor;
}

/**
 * Obtiene el color del texto del hover según el tema
 */
export function getHoverTextColor(theme: 'light' | 'dark', isHovered: boolean): string {
  if (isHovered) {
    return theme === 'light' ? '#111827' : 'white';
  }
  return theme === 'light' ? '#111827' : '#d1d5db';
}

