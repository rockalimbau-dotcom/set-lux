import i18n from '../../../../i18n/config';
import { getConditionRoleLabel, sortConditionRoleKeys } from '../../condiciones/roleCatalog';

/**
 * Escape HTML special characters
 */
export function esc(s: any): string {
  return String(s ?? '').replace(
    /[&<>]/g,
    (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
  );
}

/**
 * Translate price header to current language
 */
function translateHeader(header: string): string {
  const headerMap: Record<string, string> = {
    'Precio mensual': i18n.t('conditions.priceMonthly'),
    'Precio semanal': i18n.t('conditions.priceWeekly'),
    'Precio diario': i18n.t('conditions.priceDaily'),
    'Precio jornada': i18n.t('conditions.priceWorkDay'),
    'Precio refuerzo': i18n.t('conditions.priceReinforcement'),
    'Material propio': i18n.t('conditions.priceOwnMaterial'),
    'Precio Día extra/Festivo': i18n.t('conditions.priceExtraDayHoliday'),
    'Travel day': i18n.t('conditions.travelDay'),
    'Horas extras': i18n.t('conditions.extraHours'),
    'Localización técnica': i18n.t('conditions.technicalLocation'),
    'Carga/descarga': i18n.t('conditions.loadingUnloading'),
  };
  return headerMap[header] || header;
}

/**
 * Translate role name to current language
 */
function translateRoleName(project: any, roleName: string, sectionKey?: 'base' | 'prelight' | 'pickup'): string {
  return getConditionRoleLabel(project, roleName, sectionKey);
}

/**
 * Filter roles that have at least one non-empty price
 */
export function filterRolesWithPrices(
  project: any,
  PRICE_ROLES: string[],
  PRICE_HEADERS: string[],
  model: any,
  sectionKey: 'base' | 'prelight' | 'pickup' = 'base'
): string[] {
  const prices = sectionKey === 'base' 
    ? model.prices || {}
    : sectionKey === 'prelight'
    ? model.pricesPrelight || {}
    : model.pricesPickup || {};
    
  const relevantHeaders =
    sectionKey === 'base'
      ? PRICE_HEADERS
      : PRICE_HEADERS.filter(header => header !== 'Precio refuerzo');

  const explicitRoles = Array.isArray(model?.roles) && model.roles.length > 0
    ? model.roles
    : PRICE_ROLES;
  const sectionRoles = sectionKey === 'base'
    ? explicitRoles
    : Object.keys(prices || {});
  const orderedRoles = sortConditionRoleKeys(project, sectionRoles, PRICE_ROLES);

  return orderedRoles.filter(role => {
    return relevantHeaders.some(header => {
      const precio = prices[role]?.[header];
      return precio && precio.toString().trim() !== '';
    });
  });
}

/**
 * Generate table HTML for prices
 */
export function generatePriceTableHTML(
  project: any,
  rolesConPrecios: string[],
  PRICE_HEADERS: string[],
  model: any,
  sectionKey: 'base' | 'prelight' | 'pickup' = 'base',
  title?: string
): string {
  const prices = sectionKey === 'base' 
    ? model.prices || {}
    : sectionKey === 'prelight'
    ? model.pricesPrelight || {}
    : model.pricesPickup || {};
  
  // Filtrar headers: quitar "Precio refuerzo" de prelight y pickup
  const visibleHeaders = sectionKey === 'base'
    ? PRICE_HEADERS 
    : PRICE_HEADERS.filter(h => h !== 'Precio refuerzo');

  // Exportar solo columnas que tengan al menos un valor en los roles incluidos
  const headersWithValues = visibleHeaders.filter(header =>
    rolesConPrecios.some(role => {
      const value = prices[role]?.[header];
      return value !== null && value !== undefined && String(value).trim() !== '';
    })
  );

  if (rolesConPrecios.length === 0 || headersWithValues.length === 0) {
    return '';
  }
  
  const titleHTML = title ? `<h3 style="margin-bottom: 8px; font-size: 11px; font-weight: 700; color: #1e3a8a;">${esc(title)}</h3>` : '';
  
  return `${titleHTML}
    <table>
      <thead>
        <tr>
          <th>${i18n.t('conditions.rolePrice')}</th>
          ${headersWithValues.map(h => `<th>${esc(translateHeader(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rolesConPrecios.map(
          role => `
          <tr>
            <td style="font-weight:600;">${esc(translateRoleName(project, role, sectionKey))}</td>
            ${headersWithValues.map(h => {
              if (h === 'Material propio') {
                const rawVal = prices[role]?.[h] ?? '';
                const tipo = prices[role]?.['Material propio tipo'];
                const tipoLabel = tipo === 'semanal'
                  ? i18n.t('common.weekly')
                  : tipo === 'diario'
                  ? i18n.t('common.advertising')
                  : tipo === 'unico'
                  ? i18n.t('common.unique')
                  : '';
                const display = rawVal && tipoLabel ? `${rawVal} (${tipoLabel})` : rawVal;
                return `<td>${esc(display)}</td>`;
              }
              return `<td>${esc(prices[role]?.[h] ?? '')}</td>`;
            }).join('')}
          </tr>
        `
        ).join('')}
      </tbody>
    </table>`;
}

/**
 * Generate blocks HTML from page blocks
 */
export function generateBlocksHTML(pageBlocks: [string, string][]): string {
  return pageBlocks
    .map(
      ([title, txt]) => `
      <section>
        <h4>${esc(title)}</h4>
        <div class="legend-content">${txt}</div>
      </section>`
    )
    .join('');
}

/**
 * Get conditions label in current language
 */
export function getConditionsLabel(): string {
  let conditionsLabel = 'Condiciones';
  try {
    const currentLang = i18n?.language || 'es';
    
    // Acceder directamente al store usando la estructura correcta
    if (i18n?.store?.data?.[currentLang]?.translation?.common?.conditions) {
      conditionsLabel = i18n.store.data[currentLang].translation.common.conditions;
    } else if (i18n?.store?.data?.[currentLang]?.common?.conditions) {
      // Intentar estructura alternativa
      conditionsLabel = i18n.store.data[currentLang].common.conditions;
    } else {
      // Fallback manual basado en el idioma
      if (currentLang === 'en') {
        conditionsLabel = 'Conditions';
      } else if (currentLang === 'ca') {
        conditionsLabel = 'Condicions';
      }
    }
  } catch (error) {
    console.warn('Error getting conditions label:', error);
  }
  return conditionsLabel;
}
