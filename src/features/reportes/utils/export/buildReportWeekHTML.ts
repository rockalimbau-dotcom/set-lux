import { parseDietas } from '../text';
import i18n from '../../../../i18n/config';
import { getRoleBadgeCode, applyGenderToBadge, stripRefuerzoSuffix } from '@shared/constants/roles';
import { BuildReportWeekHTMLParams } from './types';
import { esc } from './htmlHelpers';
import { getTranslation, translateConcept, translateDietItem, translateDayName } from './translationHelpers';
import {
  calculateTotalForExport,
  deduplicateData,
  sortPersonKeysByRole,
  isMeaningfulValue,
} from './dataHelpers';
import { groupAndSortPersonsByBlock } from './buildReportWeekHTMLForPDF/sortingHelpers';

function parsePersonKeyForDisplay(pk: string): { role: string; name: string } {
  let role = '';
  let name = '';
  const extraMatch = pk.match(/^(.*?)\.(extra(?::\d+)?)__(.*)$/);
  if (extraMatch) {
    role = extraMatch[1] || '';
    name = extraMatch[3] || '';
    if (role.startsWith('REF')) {
      role = stripRefuerzoSuffix(role);
    }
  } else if (pk.includes('.pre__')) {
    const [rolePart, ...nameParts] = pk.split('.pre__');
    role = rolePart || '';
    name = nameParts.join('.pre__');
    if (role.startsWith('REF')) {
      role = stripRefuerzoSuffix(role);
    }
  } else if (pk.includes('.pick__')) {
    const [rolePart, ...nameParts] = pk.split('.pick__');
    role = rolePart || '';
    name = nameParts.join('.pick__');
    if (role.startsWith('REF')) {
      role = stripRefuerzoSuffix(role);
    }
  } else {
    const [rolePart, ...nameParts] = pk.split('__');
    role = rolePart || '';
    name = nameParts.join('__');
    if (role.startsWith('REF')) {
      role = stripRefuerzoSuffix(role);
    }
  }
  return { role, name };
}

export function buildReportWeekHTML({
  project,
  title,
  safeSemana,
  dayNameFromISO,
  toDisplayDate,
  horarioTexto,
  horarioPrelight,
  horarioPickup,
  horarioExtraByBlock,
  groupedPersonKeys,
  CONCEPTS,
  data,
}: BuildReportWeekHTMLParams): string {
  // Debug removed to improve performance

  const genderMap = (data as any)?.__genderMap as Record<string, string> | undefined;

  // Deduplicate data
  const finalData = deduplicateData(data);
  const sortedPersonKeys = sortPersonKeysByRole(Object.keys(finalData || {}));


  const restLabel = getTranslation('reports.rest', 'DESCANSO');
  const safeSemanaWithData = safeSemana.filter(iso => {
    const dayLabel = horarioTexto(iso);
    if (dayLabel !== restLabel) return true;
    return Object.values(finalData || {}).some((person: any) =>
      isMeaningfulValue(person?.Dietas?.[iso])
    );
  });
  const conceptosConDatos = [...CONCEPTS];
  const grouped = groupedPersonKeys
    ? {
        personsByBlock: {
          base: groupedPersonKeys.base || [],
          extra: groupedPersonKeys.extraGroups.flatMap(group => group.people),
          pre: groupedPersonKeys.pre || [],
          pick: groupedPersonKeys.pick || [],
        },
        extraGroups: groupedPersonKeys.extraGroups || [],
        finalPersonKeys: [
          ...(groupedPersonKeys.base || []),
          ...groupedPersonKeys.extraGroups.flatMap(group => group.people),
          ...(groupedPersonKeys.pre || []),
          ...(groupedPersonKeys.pick || []),
        ],
      }
    : groupAndSortPersonsByBlock(finalData);

  // Generate table headers
  const headDays = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">&nbsp;</th>
        ${safeSemanaWithData
          .map(
            (iso, i) => `
          <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
            ${esc(translateDayName(dayNameFromISO(iso, i)))}<br/>${esc(toDisplayDate(iso))}
          </th>`
          )
          .join('')}
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;font-weight:bold;">${esc(getTranslation('reports.total', 'Total'))}</th>
      </tr>`;

  const headHorario = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(getTranslation('reports.scheduleBase', 'Horario equipo base'))}</th>
        ${safeSemanaWithData
          .map(
            iso =>
              `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(
                horarioTexto(iso)
              )}</th>`
          )
          .join('')}
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(getTranslation('reports.week', 'Semana'))}</th>
      </tr>`;

  const generateScheduleRow = (label: string, valueForISO: (iso: string) => string) => `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:700;background:#f8fafc;">${esc(label)}</td>
          ${safeSemanaWithData
            .map(iso => `<td style="border:1px solid #999;padding:6px;font-weight:700;background:#fff8e8;">${esc(valueForISO(iso))}</td>`)
            .join('')}
          <td style="border:1px solid #999;padding:6px;">&nbsp;</td>
        </tr>`;

  const renderPersonBlock = (keys: string[]) =>
    keys
      .map(pk => {
      const { role, name } = parsePersonKeyForDisplay(String(pk));

      // Skip entries with empty or invalid roles/names
      if (!role && !name) {
        return '';
      }

      const gender = genderMap?.[pk];
      const badgeCode = getRoleBadgeCode(role, i18n.language);
      const badgeDisplay = applyGenderToBadge(badgeCode, gender);
      const displayName = badgeDisplay && name ? `${badgeDisplay} — ${name}` : (badgeDisplay || name);

      const head = `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:600;background:#f5f5f5;">
            ${esc(displayName)}
          </td>
          ${safeSemanaWithData
            .map(
              () => `<td style="border:1px solid #999;padding:6px;">&nbsp;</td>`
            )
            .join('')}
          <td style="border:1px solid #999;padding:6px;">&nbsp;</td>
        </tr>`;

      const rows = conceptosConDatos
        .filter(c => {
          // Only show concepts that have meaningful data for this person
          return safeSemanaWithData.some(iso => {
            const value = finalData?.[pk]?.[c]?.[iso];
            return isMeaningfulValue(value);
          });
        })
        .map(c => {
          const total = calculateTotalForExport(finalData, pk, c, safeSemanaWithData, false);
          let totalDisplay = '';
          if (total === '') {
            totalDisplay = '';
          } else if (c === 'Dietas' && typeof total === 'object' && total !== null && 'breakdown' in total) {
            const breakdown = (total as { breakdown: Map<string, number> }).breakdown;
            if (breakdown.size > 0) {
              totalDisplay = Array.from(breakdown.entries())
                .map(([item, count]) => `x${count} ${item}`)
                .join(', ');
            }
          } else if (typeof total === 'number') {
            totalDisplay = total % 1 === 0 ? total.toString() : total.toFixed(2);
          } else {
            totalDisplay = total.toString();
          }

          return `
        <tr>
          <td style="border:1px solid #999;padding:6px;">${esc(translateConcept(c))}</td>
          ${safeSemanaWithData
            .map(iso => {
              let cellValue = finalData?.[pk]?.[c]?.[iso] ?? '';
              // For SI/NO concepts, show "1" instead of "SI" or "Sí"
              if ((c === 'Nocturnidad' || c === 'Penalty lunch' || c === 'Transporte' || c === 'Material propio') && cellValue) {
                const trimmedValue = cellValue.toString().trim().toLowerCase();
                if (trimmedValue === 'sí' || trimmedValue === 'si') {
                  cellValue = '1';
                }
              }
              // Translate diet items if concept is Dietas
              if (c === 'Dietas' && cellValue && cellValue.toString().trim() !== '') {
                try {
                  const parsed = parseDietas(cellValue);
                  const translatedItems = parsed.items.size > 0 
                    ? Array.from(parsed.items).map(item => translateDietItem(item))
                    : [];
                  cellValue = translatedItems.join(' + ');
                  if (parsed.ticket !== null) {
                    cellValue += (translatedItems.length > 0 ? ' + ' : '') + `Ticket(${parsed.ticket})`;
                  }
                } catch (e) {
                  // If parsing fails, use original value
                }
              }
              return `<td style="border:1px solid #999;padding:6px;">${esc(cellValue)}</td>`;
            })
            .join('')}
          <td style="border:1px solid #999;padding:6px;text-align:left;font-weight:bold;">${esc(totalDisplay)}</td>
        </tr>`;
        })
        .join('');

        return head + rows;
      })
      .join('');

  const bodyParts: string[] = [];
  bodyParts.push(renderPersonBlock(grouped.personsByBlock.base));
  grouped.extraGroups.forEach(group => {
    if (typeof horarioExtraByBlock === 'function') {
      bodyParts.push(
        generateScheduleRow(
          getTranslation('reports.extraSchedule', 'Equipo extra / Dif horarios'),
          iso => horarioExtraByBlock(group.blockKey, iso)
        )
      );
    }
    bodyParts.push(renderPersonBlock(group.people));
  });
  if (grouped.personsByBlock.pre.length > 0 && typeof horarioPrelight === 'function') {
    bodyParts.push(
      generateScheduleRow(
        getTranslation('reports.prelightSchedule', 'Horario Equipo Prelight'),
        horarioPrelight
      )
    );
  }
  bodyParts.push(renderPersonBlock(grouped.personsByBlock.pre));
  if (grouped.personsByBlock.pick.length > 0 && typeof horarioPickup === 'function') {
    bodyParts.push(
      generateScheduleRow(
        getTranslation('reports.pickupSchedule', 'Horario Equipo Recogida'),
        horarioPickup
      )
    );
  }
  bodyParts.push(renderPersonBlock(grouped.personsByBlock.pick));

  const body = bodyParts.join('');

  // Generate HTML
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))} – ${esc(title || getTranslation('reports.week', 'Semana'))}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.3;
      font-size: 12px;
    }
    .container { max-width: 100%; margin: 0 auto; background: white; min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 0; position: relative; }
    .header { background: white; color: #0f172a; flex-shrink: 0; }
    .title-bar {
      background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 10px 20px;
      text-align: center;
    }
    .title-text {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .content { padding: 12px 20px; flex: 1; margin-bottom: 0; }
    .info-panel {
      background: #f1f5f9;
      margin: 10px 0 6px 0;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 18px;
    }
    .info-grid-secondary { margin-top: 18px; }
    .info-column { display: grid; gap: 4px; }
    .info-column-right { text-align: right; align-items: flex-end; justify-self: end; }
    .info-row {
      display: flex;
      gap: 6px;
      align-items: baseline;
      flex-wrap: wrap;
      font-size: 10px;
      color: #334155;
    }
    .info-row-right { justify-content: flex-end; text-align: right; }
    .info-label { font-weight: 700; color: #1f2937; }
    .info-value { font-weight: 500; color: #0f172a; }
    .week-title { font-size: 14px; font-weight: 600; color: #1e293b; margin: 12px 0 8px 0; padding: 4px 0; border-bottom: 1px solid #e2e8f0; }
    .table-container { background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; font-size: 10px; border: 2px solid #1e3a8a; }
    th { background: #1e3a8a; color: white; padding: 6px 6px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; border: 1px solid white; }
    td { padding: 6px 6px; border: 1px solid #e2e8f0; background: white; vertical-align: top; color: #1e293b; }
    .footer {
      text-align: center;
      padding: 10px 0;
      color: #64748b;
      font-size: 6px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex-shrink: 0;
      width: 100%;
      margin-bottom: 8px;
    }
    .setlux-logo { font-weight: 700; }
    .setlux-logo .set { color: #f97316; }
    .setlux-logo .lux { color: #3b82f6; }
    
    @media print {
      .footer { 
        position: fixed !important; 
        bottom: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        width: 100% !important; 
        background: white !important; 
        z-index: 9999 !important; 
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #64748b !important;
        font-size: 6px !important;
        padding: 6px 0 !important;
        border-top: 1px solid #e2e8f0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-bar">
        <div class="title-text">${esc(getTranslation('pdf.reportsTitle', 'REPORTES ELÉCTRICOS'))}</div>
      </div>
    </div>
    <div class="content">
      <div class="info-panel">
        <div class="info-grid info-grid-top">
          <div class="info-row">
            <span class="info-label">${esc(getTranslation('pdf.production', 'Producción'))}:</span>
            <span class="info-value">${esc(project?.productora || project?.produccion || '')}</span>
          </div>
          <div class="info-row info-row-right">
            <span class="info-label">${esc(getTranslation('pdf.dop', 'DoP'))}:</span>
            <span class="info-value">${esc(project?.dop || '')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${esc(getTranslation('pdf.project', 'Proyecto'))}:</span>
            <span class="info-value">${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))}</span>
          </div>
          <div class="info-row info-row-right">
            <span class="info-label">${esc(getTranslation('pdf.gaffer', 'Gaffer'))}:</span>
            <span class="info-value">${esc((project as any)?.gaffer || '')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${esc(getTranslation('pdf.warehouse', 'Almacén'))}:</span>
            <span class="info-value">${esc(project?.almacen || '')}</span>
          </div>
        </div>
      </div>
      <div class="week-title">${esc(title || getTranslation('reports.week', 'Semana'))}</div>
      <div class="table-container">
        <table>
          <thead>
            ${headDays}
            ${headHorario}
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      <span>${esc(getTranslation('footer.generatedBy', 'Generado automáticamente por'))}</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
    </div>
  </div>
</body>
</html>`;

  return html;
}
