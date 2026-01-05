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
  const headerTitle = i18n.t('conditions.departmentTitle');
  const rolesConPrecios = filterRolesWithPrices(PRICE_ROLES, PRICE_HEADERS, model);
  const table = includeHeader ? generatePriceTableHTML(rolesConPrecios, PRICE_HEADERS, model) : '';
  const blocks = generateBlocksHTML(pageBlocks);
  const infoPanel = includeHeader ? generateInfoPanel(project) : '';
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
      <h1>${esc(headerTitle)}</h1>
    </div>
    <div class="content">
      ${includeHeader ? `${infoPanel}
      <div class="table-container">
        ${table}
      </div>` : ''}
      ${blocks}
    </div>
    ${footer}
  </div>
</body>
</html>`;
}

