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
function translateRoleName(roleName: string, sectionKey?: 'base' | 'prelight' | 'pickup'): string {
  // Si el nombre del rol empieza con "REF" seguido de un código (REFG, REFBB, etc.), es un refuerzo
  if (roleName.startsWith('REF') && roleName.length > 3) {
    // Extraer el código del rol base (G, BB, E, etc.)
    const baseRoleCode = roleName.substring(3);
    const roleNameToCode: Record<string, string> = {
      'G': 'G',
      'BB': 'BB',
      'E': 'E',
      'AUX': 'AUX',
      'M': 'M',
      'TM': 'TM',
      'FB': 'FB',
    };
    const code = roleNameToCode[baseRoleCode] || baseRoleCode;
    const translationKey = `team.roles.${code}`;
    const baseLabel = i18n.t(translationKey) !== translationKey ? i18n.t(translationKey) : baseRoleCode;
    
    // Añadir prefijo de refuerzo antes del nombre del rol base
    let refuerzoLabel = `${i18n.t('team.reinforcementPrefix')} ${baseLabel}`;
    
    // Añadir sufijo según la sección
    if (sectionKey === 'prelight') {
      refuerzoLabel += ' Prelight';
    } else if (sectionKey === 'pickup') {
      refuerzoLabel += ' Recogida';
    }
    
    return refuerzoLabel;
  }
  
  // Mapeo de nombres de roles en español a códigos
  const roleNameToCode: Record<string, string> = {
    'Gaffer': 'G',
    'Best boy': 'BB',
    'Rigging Gaffer': 'RG',
    'Rigging Best Boy': 'RBB',
    'Rigging Eléctrico': 'RE',
    'Eléctrico': 'E',
    'Auxiliar': 'AUX',
    'Meritorio': 'M',
    'Técnico de mesa': 'TM',
    'Finger boy': 'FB',
    'Técnico de Generador': 'TG',
    'Eléctrico de potencia': 'EPO',
    'Técnico de prácticos': 'TP',
    'Refuerzo': 'REF',
  };
  
  const roleCode = roleNameToCode[roleName];
  if (roleCode) {
    const translationKey = `team.roles.${roleCode}`;
    const translated = i18n.t(translationKey);
    // Si la traducción existe (no es la clave misma), devolverla; si no, devolver el nombre original
    let result = translated !== translationKey ? translated : roleName;
    
    // Añadir sufijo según la sección
    if (sectionKey === 'prelight') {
      result += ' Prelight';
    } else if (sectionKey === 'pickup') {
      result += ' Recogida';
    }
    
    return result;
  }
  return roleName;
}

/**
 * Filter roles that have at least one non-empty price
 */
export function filterRolesWithPrices(
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
    
  return PRICE_ROLES.filter(role => {
    return PRICE_HEADERS.some(header => {
      const precio = prices[role]?.[header];
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
  
  const titleHTML = title ? `<h3 style="margin-bottom: 8px; font-size: 11px; font-weight: 700; color: #1e3a8a;">${esc(title)}</h3>` : '';
  
  return `${titleHTML}
    <table>
      <thead>
        <tr>
          <th>${i18n.t('conditions.rolePrice')}</th>
          ${visibleHeaders.map(h => `<th>${esc(translateHeader(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rolesConPrecios.map(
          role => `
          <tr>
            <td style="font-weight:600;">${esc(translateRoleName(role, sectionKey))}</td>
            ${visibleHeaders.map(h => {
              if (h === 'Material propio') {
                const rawVal = prices[role]?.[h] ?? '';
                const tipo = prices[role]?.['Material propio tipo'];
                const tipoLabel = tipo === 'semanal'
                  ? i18n.t('common.weekly')
                  : tipo === 'diario'
                  ? i18n.t('common.advertising')
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

