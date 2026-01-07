import i18n from '../../../../i18n/config';
import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';

/**
 * Pad number to 2 digits
 */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Format date to DD/MM/YYYY
 * Note: This function is not exported as there's a local version in export.ts
 */
const toDDMMYYYY = (d: Date): string =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

/**
 * Escape HTML special characters
 */
export const esc = (s: any = ''): string =>
  String(s).replace(
    /[&<>"]/g,
    (m: string) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
      })[m] || m
  );

/**
 * Get translation from i18n store
 */
export function getTranslation(key: string, fallback: string): string {
  try {
    const currentLang = i18n?.language || 'es';
    
    // For common.planning, use direct access like in condiciones PDF
    if (key === 'common.planning') {
      if (i18n?.store?.data?.[currentLang]?.translation?.common?.planning) {
        return i18n.store.data[currentLang].translation.common.planning;
      }
      // Fallback manual
      if (currentLang === 'en') return 'Planning';
      if (currentLang === 'ca') return 'Planificació';
      return 'Planificación';
    }
    
    // Access store directly for other keys
    if (i18n?.store?.data?.[currentLang]?.translation) {
      const translations = i18n.store.data[currentLang].translation;
      const keys = key.split('.');
      let value: any = translations;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          break;
        }
      }
      if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }
    
    // Fallback: try i18n.t() directly
    const translated = i18n.t(key);
    if (translated && translated !== key && translated.trim() !== '') {
      return translated;
    }
    
    return fallback;
  } catch (error) {
    // Final fallback for common.planning
    if (key === 'common.planning') {
      const currentLang = i18n?.language || 'es';
      if (currentLang === 'en') return 'Planning';
      if (currentLang === 'ca') return 'Planificació';
      return 'Planificación';
    }
    return fallback;
  }
}

/**
 * Translate week label
 */
export function translateWeekLabel(label: string): string {
  if (!label) return getTranslation('planning.week', 'Semana');
  const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
  if (match) {
    const number = match[2];
    if (number.startsWith('-')) {
      return getTranslation('planning.weekFormatNegative', `Semana -${number.substring(1)}`).replace('{{number}}', number.substring(1));
    } else {
      return getTranslation('planning.weekFormat', `Semana ${number}`).replace('{{number}}', number);
    }
  }
  return label;
}

/**
 * Translate jornada type
 */
export function translateJornadaType(tipo: string): string {
  return translateJornadaTypeUtil(tipo, (key: string, defaultValue?: string) => getTranslation(key, defaultValue || key));
}

/**
 * Get filename translation
 */
export function getFilenameTranslation(key: string, fallback: string): string {
  const currentLang = i18n?.language || 'es';
  if (i18n?.store?.data?.[currentLang]?.translation) {
    const translations = i18n.store.data[currentLang].translation;
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        break;
      }
    }
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return fallback;
}

