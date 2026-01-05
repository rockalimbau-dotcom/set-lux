import i18n from '../../../../i18n/config';
import { Week, DayInfo } from './types';
import { esc, getTranslation, translateWeekLabel, translateJornadaType } from './helpers';

/**
 * Get short day name (first 3 chars, uppercase)
 */
function getDayNameShort(index: number): string {
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayName = i18n.t(`planning.${dayKeys[index]}`);
  return dayName.substring(0, 3).toUpperCase();
}

/**
 * Check if a day has meaningful data
 */
function hasMeaningfulData(day: any): boolean {
  if (!day) return false;
  
  const hasTeam = day.team && day.team.length > 0;
  const hasPrelight = day.prelight && day.prelight.length > 0;
  const hasPickup = day.pickup && day.pickup.length > 0;
  const hasIssue = day.issue && day.issue.trim() !== '';
  const hasLocation = day.loc && day.loc.trim() !== '' && day.loc !== 'DESCANSO';
  const hasCut = day.cut && day.cut.trim() !== '';
  const hasSchedule = day.start && day.end;
  const isNotDescanso = day.tipo !== 'Descanso';
  
  return hasTeam || hasPrelight || hasPickup || hasIssue || hasLocation || hasCut || hasSchedule || isNotDescanso;
}

/**
 * Generate week table HTML
 */
function generateWeekTable(
  week: Week,
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date
): string {
  const monday = parseYYYYMMDD(week.startDate);
  const dayNames = [0, 1, 2, 3, 4, 5, 6].map(getDayNameShort);
  
  // Check which days have meaningful data
  const meaningfulDays = DAYS.map((_, i) => hasMeaningfulData(week.days?.[i]));
  
  // Filter to only include meaningful days
  const filteredDays = DAYS.filter((_, i) => meaningfulDays[i]);
  const filteredDateRow = filteredDays.map((_, i) => {
    const originalIndex = DAYS.findIndex((_, idx) => meaningfulDays[idx] && idx >= i);
    const dayDate = addDays(monday, originalIndex);
    const dayName = dayNames[originalIndex];
    const dayNumber = dayDate.getDate();
    return `${dayName} ${dayNumber}`;
  });
  
  // Header row with dates
  const headDays = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">&nbsp;</th>
        ${filteredDateRow.map(d => `
          <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
            ${esc(d)}
          </th>`).join('')}
      </tr>`;

  // Second header row with schedule info
  const headHorario = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(getTranslation('planning.schedule', 'Horario'))}</th>
        ${filteredDays.map((_, i) => {
          const originalIndex = DAYS.findIndex((_, idx) => meaningfulDays[idx] && idx >= i);
          const day = week.days?.[originalIndex];
          const schedule = day?.start && day?.end ? `${day.start}-${day.end}` : getTranslation('reports.addInPlanning', 'Añadelo en Planificación');
          return `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(schedule)}</th>`;
        }).join('')}
      </tr>`;

  // Data rows
  const concepts = [
    { key: getTranslation('planning.dayType', 'Jornada'), getter: (i: number) => translateJornadaType(week.days?.[i]?.tipo || '') },
    { key: getTranslation('planning.cutRow', 'Corte cámara'), getter: (i: number) => week.days?.[i]?.cut || '' },
    { key: getTranslation('planning.location', 'Localización'), getter: (i: number) => week.days?.[i]?.loc || '' },
    { 
      key: getTranslation('planning.team', 'Equipo'), 
      getter: (i: number) => {
        const team = (week.days?.[i]?.team || [])
          .map(m => esc(`${m.role}${m.source === 'pre' ? 'P' : m.source === 'pick' ? 'R' : ''} ${m.name || ''}`.trim()))
          .join('\n');
        return team;
      }
    },
    { 
      key: getTranslation('planning.prelight', 'Prelight'), 
      getter: (i: number) => {
        const lst = (week.days?.[i]?.prelight || [])
          .map(m => esc(`${m.role}${m.source === 'pre' ? 'P' : ''} ${m.name || ''}`.trim()))
          .join('\n');
        const hs = [week.days?.[i]?.prelightStart, week.days?.[i]?.prelightEnd]
          .filter(Boolean)
          .join('–');
        if (hs && lst) {
          return `${hs}\n${lst}`;
        } else if (hs) {
          return hs;
        } else {
          return lst;
        }
      }
    },
    { 
      key: getTranslation('planning.pickup', 'Recogida'), 
      getter: (i: number) => {
        const lst = (week.days?.[i]?.pickup || [])
          .map(m => esc(`${m.role}${m.source === 'pick' ? 'R' : ''} ${m.name || ''}`.trim()))
          .join('\n');
        const hs = [week.days?.[i]?.pickupStart, week.days?.[i]?.pickupEnd]
          .filter(Boolean)
          .join('–');
        if (hs && lst) {
          return `${hs}\n${lst}`;
        } else if (hs) {
          return hs;
        } else {
          return lst;
        }
      }
    },
    { key: getTranslation('planning.issues', 'Incidencias'), getter: (i: number) => week.days?.[i]?.issue || '' }
  ];

  // Filter concepts that have meaningful data
  const conceptosConDatos = concepts.filter(concepto => {
    return filteredDays.some((_, i) => {
      const originalIndex = DAYS.findIndex((_, idx) => meaningfulDays[idx] && idx >= i);
      const value = concepto.getter(originalIndex);
      if (!value) return false;
      
      const trimmedValue = value.toString().trim();
      if (trimmedValue === '') return false;
      if (trimmedValue === '0') return false;
      
      return true;
    });
  });

  // Generate body rows
  const body = conceptosConDatos.map(concepto => `
      <tr>
        <td style="border:1px solid #999;padding:6px;">${esc(concepto.key)}</td>
        ${filteredDays.map((_, i) => {
          const originalIndex = DAYS.findIndex((_, idx) => meaningfulDays[idx] && idx >= i);
          return `<td style="border:1px solid #999;padding:6px;">${esc(concepto.getter(originalIndex))}</td>`;
        }).join('')}
      </tr>`
  ).join('');

  return `
      <div class="week-section">
        <table>
          <thead>${headDays}${headHorario}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
}

/**
 * Get PDF styles
 */
function getPDFStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.3;
      font-size: 12px;
    }
    .container { max-width: 100%; margin: 0 auto; background: white; min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 0; position: relative; }
    .container-pdf {
      width: 1123px;
      height: 794px;
      background: white;
      display: flex;
      flex-direction: column;
    }
    .header { background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%); color: white; padding: 12px 20px; text-align: center; flex-shrink: 0; }
    .header h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 12px 20px; flex: 1; margin-bottom: 0; }
    .info-panel { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; display: flex; gap: 24px; align-items: center; }
    .info-item { display: flex; flex-direction: column; align-items: flex-start; }
    .info-label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 11px; color: #1e293b; font-weight: 500; }
    .table-container { background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; font-size: 10px; border: 2px solid #1e3a8a; }
    th { background: #1e3a8a; color: white; padding: 6px 6px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; border: 1px solid white; }
    td { padding: 6px 6px; border: 1px solid #e2e8f0; background: white; vertical-align: top; color: #1e293b; white-space: pre-line; }
    .footer {
      text-align: center;
      padding: 10px 0;
      color: #64748b;
      font-size: 6px;
      border-top: 1px solid #e2e8f0;
      background: white;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
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
    
    .week-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .week-section h2 {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
      padding: 4px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .week-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 12px 0 8px 0;
      padding: 4px 0;
      border-bottom: 1px solid #e2e8f0;
    }
  `;
}

/**
 * Build HTML for PDF export
 */
export function buildPlanificacionHTMLForPDF(
  project: any,
  weeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date,
  scope?: 'pre' | 'pro'
): string {
  const weekTables = weeks.map(w => generateWeekTable(w, DAYS, parseYYYYMMDD, addDays)).join('');

  const scopeTitle = scope === 'pre' 
    ? esc(getTranslation('planning.preproduction', 'Preproducción'))
    : scope === 'pro' 
    ? esc(getTranslation('planning.production', 'Producción'))
    : esc(translateWeekLabel(weeks[0]?.label || getTranslation('planning.week', 'Semana')));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))} – ${esc(getTranslation('common.planning', 'Planificación'))}</title>
  <style>${getPDFStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${esc(getTranslation('common.planning', 'Planificación'))} - ${scopeTitle}</h1>
    </div>
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">${esc(getTranslation('common.productionLabel', 'Producción'))}</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${esc(getTranslation('common.project', 'Proyecto'))}</div>
          <div class="info-value">${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))}</div>
        </div>
      </div>
      <div class="week-title">${esc(translateWeekLabel(weeks[0]?.label || getTranslation('planning.week', 'Semana')))}</div>
      <div class="table-container">
        ${weekTables}
      </div>
    </div>
    <div class="footer">
      <span>${esc(getTranslation('footer.generatedBy', 'Generado automáticamente por'))} <span class="setlux-logo"><span class="set">Set</span><span class="lux">Lux</span></span></span>
    </div>
  </div>
</body>
</html>`;
}

