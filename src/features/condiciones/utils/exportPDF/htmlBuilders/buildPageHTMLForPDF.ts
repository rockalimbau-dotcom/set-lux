import i18n from '../../../../../i18n/config';
import { esc } from '../helpers';
import { filterRolesWithPrices, generatePriceTableHTML, generateBlocksHTML } from '../helpers';
import { baseStyles } from './styles';
import { generateInfoPanel, generateFooter } from './contentHelpers';

/**
 * Build HTML for a single page with pagination
 */
export function buildCondicionesPageHTMLForPDF(
  project: any,
  which: string,
  model: any,
  PRICE_HEADERS: string[],
  PRICE_ROLES: string[],
  pageBlocks: [string, string][],
  includeHeader: boolean = true
): string {
  const headerTitle = 'CONDICIONES ELÉCTRICOS';
  
  // Tabla base
  const rolesConPreciosBase = filterRolesWithPrices(PRICE_ROLES, PRICE_HEADERS, model, 'base');
  const tableBase = includeHeader && rolesConPreciosBase.length > 0 
    ? generatePriceTableHTML(rolesConPreciosBase, PRICE_HEADERS, model, 'base', i18n.t('conditions.baseTeam'))
    : '';
  
  // Tabla prelight (si existe y tiene roles)
  const hasPrelight = model.pricesPrelight !== undefined;
  const rolesConPreciosPrelight = hasPrelight 
    ? filterRolesWithPrices(PRICE_ROLES, PRICE_HEADERS, model, 'prelight')
    : [];
  const tablePrelight = includeHeader && rolesConPreciosPrelight.length > 0
    ? generatePriceTableHTML(rolesConPreciosPrelight, PRICE_HEADERS, model, 'prelight', i18n.t('conditions.prelightTeam'))
    : '';
  
  // Tabla pickup (si existe y tiene roles)
  const hasPickup = model.pricesPickup !== undefined;
  const rolesConPreciosPickup = hasPickup
    ? filterRolesWithPrices(PRICE_ROLES, PRICE_HEADERS, model, 'pickup')
    : [];
  const tablePickup = includeHeader && rolesConPreciosPickup.length > 0
    ? generatePriceTableHTML(rolesConPreciosPickup, PRICE_HEADERS, model, 'pickup', i18n.t('conditions.pickupTeam'))
    : '';
  
  // Combinar todas las tablas
  const allTables = [tableBase, tablePrelight, tablePickup].filter(t => t).join('');
  const tablesHTML = allTables ? `<div class="table-container">${allTables}</div>` : '';
  
  const blocks = generateBlocksHTML(pageBlocks);
  const infoPanel = includeHeader ? generateInfoPanel(project, true) : '';
  const footer = generateFooter();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || 'Proyecto')} – ${esc(headerTitle)}</title>
  <style>
    ${baseStyles}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-bar">
        <div class="title-text">${esc(headerTitle)}</div>
      </div>
    </div>
    <div class="content">
      ${includeHeader ? `${infoPanel}
      ${tablesHTML}` : ''}
      ${blocks}
    </div>
    ${footer}
  </div>
</body>
</html>`;
}
