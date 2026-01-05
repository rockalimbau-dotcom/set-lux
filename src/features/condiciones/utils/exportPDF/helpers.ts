import i18n from '../../../../i18n/config';

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
export function translateHeader(header: string): string {
  const headerMap: Record<string, string> = {
    'Precio mensual': i18n.t('conditions.priceMonthly'),
    'Precio semanal': i18n.t('conditions.priceWeekly'),
    'Precio diario': i18n.t('conditions.priceDaily'),
    'Precio jornada': i18n.t('conditions.priceWorkDay'),
    'Precio refuerzo': i18n.t('conditions.priceReinforcement'),
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
export function translateRoleName(roleName: string): string {
  // Mapeo de nombres de roles en español a códigos
  const roleNameToCode: Record<string, string> = {
    'Gaffer': 'G',
    'Best boy': 'BB',
    'Eléctrico': 'E',
    'Auxiliar': 'AUX',
    'Meritorio': 'M',
    'Técnico de mesa': 'TM',
    'Finger boy': 'FB',
    'Refuerzo': 'REF',
  };
  
  const roleCode = roleNameToCode[roleName];
  if (roleCode) {
    const translationKey = `team.roles.${roleCode}`;
    const translated = i18n.t(translationKey);
    // Si la traducción existe (no es la clave misma), devolverla; si no, devolver el nombre original
    return translated !== translationKey ? translated : roleName;
  }
  return roleName;
}

/**
 * Filter roles that have at least one non-empty price
 */
export function filterRolesWithPrices(
  PRICE_ROLES: string[],
  PRICE_HEADERS: string[],
  model: any
): string[] {
  return PRICE_ROLES.filter(role => {
    return PRICE_HEADERS.some(header => {
      const precio = model.prices?.[role]?.[header];
      return precio && precio.toString().trim() !== '';
    });
  });
}

/**
 * Generate table HTML for prices
 */
export function generatePriceTableHTML(
  rolesConPrecios: string[],
  PRICE_HEADERS: string[],
  model: any
): string {
  return `
    <table>
      <thead>
        <tr>
          <th>${i18n.t('conditions.rolePrice')}</th>
          ${PRICE_HEADERS.map(h => `<th>${esc(translateHeader(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rolesConPrecios.map(
          role => `
          <tr>
            <td style="font-weight:600;">${esc(translateRoleName(role))}</td>
            ${PRICE_HEADERS.map(
              h => `<td>${esc(model.prices?.[role]?.[h] ?? '')}</td>`
            ).join('')}
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

