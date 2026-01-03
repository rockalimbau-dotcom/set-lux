import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import i18n from '../../../i18n/config';

// Utilidades de exportación PDF para Planificación
// Basado en la implementación de reportes/utils/export.ts

const pad2 = (n: number): string => String(n).padStart(2, '0');
const toDDMMYYYY = (d: Date): string =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const esc = (s: any = ''): string =>
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

interface DayInfo {
  idx: number;
  key: string;
  name: string;
}

interface Day {
  tipo?: string;
  start?: string;
  end?: string;
  cut?: string;
  loc?: string;
  team?: Array<{ role?: string; name?: string; source?: string }>;
  prelight?: Array<{ role?: string; name?: string; source?: string }>;
  pickup?: Array<{ role?: string; name?: string; source?: string }>;
  prelightStart?: string;
  prelightEnd?: string;
  pickupStart?: string;
  pickupEnd?: string;
  issue?: string;
  [key: string]: any;
}

interface Week {
  label: string;
  startDate: string;
  days?: Day[];
  [key: string]: any;
}

export function buildPlanificacionHTML(
  project: any,
  weeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date
): string {
  const rows = (w: Week): string => {
    const monday = parseYYYYMMDD(w.startDate);
    const dayCells = (getter: (i: number) => any): string =>
      DAYS.map((_, i) => `<td>${esc(getter(i) ?? '')}</td>`).join('');
    const dateRow = DAYS.map((_, i) => toDDMMYYYY(addDays(monday, i)));

    return `
      <tr><th>Fecha</th>${dateRow
        .map(esc)
        .map(d => `<td>${d}</td>`)
        .join('')}</tr>
      <tr><th>Jornada</th>${dayCells(i => w.days?.[i]?.tipo || '')}</tr>
      <tr><th>Inicio</th>${dayCells(i => w.days?.[i]?.start || '')}</tr>
      <tr><th>Fin</th>${dayCells(i => w.days?.[i]?.end || '')}</tr>
      <tr><th>Corte cámara</th>${dayCells(i => w.days?.[i]?.cut || '')}</tr>
      <tr><th>Localización</th>${dayCells(i => w.days?.[i]?.loc || '')}</tr>
      <tr><th>Equipo</th>${DAYS.map((_, i) => {
        const team = (w.days?.[i]?.team || [])
          .map(m =>
            esc(
              `${m.role}${m.source === 'pre' ? 'P' : m.source === 'pick' ? 'R' : ''} ${m.name || ''}`.trim()
            )
          )
          .join(' · ');
        return `<td>${team}</td>`;
      }).join('')}</tr>
      <tr><th>Prelight</th>${DAYS.map((_, i) => {
        const lst = (w.days?.[i]?.prelight || [])
          .map(m =>
            esc(
              `${m.role}${m.source === 'pre' ? 'P' : ''} ${m.name || ''}`.trim()
            )
          )
          .join(' · ');
        const hs = [w.days?.[i]?.prelightStart, w.days?.[i]?.prelightEnd]
          .filter(Boolean)
          .join('–');
        return `<td>${hs ? `<div>${esc(hs)}</div>` : ''}${lst}</td>`;
      }).join('')}</tr>
      <tr><th>Recogida</th>${DAYS.map((_, i) => {
        const lst = (w.days?.[i]?.pickup || [])
          .map(m =>
            esc(
              `${m.role}${m.source === 'pick' ? 'R' : ''} ${m.name || ''}`.trim()
            )
          )
          .join(' · ');
        const hs = [w.days?.[i]?.pickupStart, w.days?.[i]?.pickupEnd]
          .filter(Boolean)
          .join('–');
        return `<td>${hs ? `<div>${esc(hs)}</div>` : ''}${lst}</td>`;
      }).join('')}</tr>
      <tr><th>Incidencias</th>${dayCells(i => w.days?.[i]?.issue || '')}</tr>
    `;
  };

  const weekBlocks = weeks
    .map(
      w => `
    <section class="wk">
      <h2>${esc(w.label)}</h2>
      <table class="plan">
        <thead><tr>
          <th>Fila / Día</th>
          ${DAYS.map(d => `<th>${d.name}</th>`).join('')}
        </tr></thead>
        <tbody>${rows(w)}</tbody>
      </table>
    </section>
  `
    )
    .join('');

  return `
  <div class="export-doc" style="background:#fff">
    <h1>${esc(project?.nombre || 'Proyecto')} – Planificación</h1>
    ${weekBlocks}
  </div>`;
}

export function buildPlanificacionHTMLForPDF(
  project: any,
  weeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date,
  scope?: 'pre' | 'pro'
): string {
  const esc = (s: any): string =>
    String(s ?? '').replace(
      /[&<>]/g,
      (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
    );

  // Helper to get translation from store - same method as condiciones PDF
  const getTranslation = (key: string, fallback: string): string => {
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
  };

  // Helper to translate week label
  const translateWeekLabel = (label: string): string => {
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
  };

  // Helper to translate jornada type
  const translateJornadaType = (tipo: string): string => {
    if (!tipo) return '';
    const typeMap: Record<string, string> = {
      'Rodaje': getTranslation('planning.shooting', 'Rodaje'),
      'Carga': getTranslation('planning.loading', 'Carga'),
      'Descarga': getTranslation('planning.unloading', 'Descarga'),
      'Localizar': getTranslation('planning.location', 'Localizar'),
      'Travel Day': getTranslation('planning.travelDay', 'Travel Day'),
      'Rodaje Festivo': getTranslation('planning.holidayShooting', 'Rodaje Festivo'),
      'Fin': getTranslation('planning.end', 'Fin'),
      'Descanso': getTranslation('planning.rest', 'Descanso'),
    };
    return typeMap[tipo] || tipo;
  };

  // Generate table content for each week - using EXACT same format as reports
  const generateWeekTable = (week: Week): string => {
    const monday = parseYYYYMMDD(week.startDate);
    
    // Format days as "LUN 8", "MAR 9", etc. - translated
    const getDayNameShort = (index: number): string => {
      const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayName = i18n.t(`planning.${dayKeys[index]}`);
      // Get first 3 characters and uppercase
      return dayName.substring(0, 3).toUpperCase();
    };
    const dayNames = [0, 1, 2, 3, 4, 5, 6].map(getDayNameShort);
    
    // Check which days have meaningful data (not just "DESCANSO")
    const meaningfulDays = DAYS.map((_, i) => {
      const day = week.days?.[i];
      if (!day) return false;
      
      // Check if day has any meaningful data beyond just "DESCANSO"
      const hasTeam = day.team && day.team.length > 0;
      const hasPrelight = day.prelight && day.prelight.length > 0;
      const hasPickup = day.pickup && day.pickup.length > 0;
      const hasIssue = day.issue && day.issue.trim() !== '';
      const hasLocation = day.loc && day.loc.trim() !== '' && day.loc !== 'DESCANSO';
      const hasCut = day.cut && day.cut.trim() !== '';
      const hasSchedule = day.start && day.end;
      const isNotDescanso = day.tipo !== 'Descanso';
      
      return hasTeam || hasPrelight || hasPickup || hasIssue || hasLocation || hasCut || hasSchedule || isNotDescanso;
    });
    
    // Filter to only include meaningful days
    const filteredDays = DAYS.filter((_, i) => meaningfulDays[i]);
    const filteredDateRow = filteredDays.map((_, i) => {
      const originalIndex = DAYS.findIndex((_, idx) => meaningfulDays[idx] && idx >= i);
      const dayDate = addDays(monday, originalIndex);
      const dayName = dayNames[originalIndex];
      const dayNumber = dayDate.getDate();
      return `${dayName} ${dayNumber}`;
    });
    
    // Header row with dates - EXACT same format as reports
    const headDays = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">&nbsp;</th>
        ${filteredDateRow.map(d => `
          <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
            ${esc(d)}
          </th>`).join('')}
      </tr>`;

    // Second header row with schedule info - EXACT same format as reports
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

    // Data rows - using EXACT same structure as reports - translated
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

    // Generate body rows - EXACT same format as reports
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
  };

  const weekTables = weeks.map(generateWeekTable).join('');

  // EXACT same HTML structure and styles as reports
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))} – ${esc(getTranslation('common.planning', 'Planificación'))}</title>
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
    .container-pdf {
      /* Fixed size to match html2canvas capture (A4 landscape @96dpi) */
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
    
    /* Ensure footer visibility in PDF */
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${esc(getTranslation('common.planning', 'Planificación'))} - ${scope === 'pre' ? esc(getTranslation('planning.preproduction', 'Preproducción')) : scope === 'pro' ? esc(getTranslation('planning.production', 'Producción')) : esc(translateWeekLabel(weeks[0]?.label || getTranslation('planning.week', 'Semana')))}</h1>
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

export async function exportToPDF(
  project: any,
  weeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date
): Promise<void> {
  try {
    // Detect week type automatically for individual week PDF
    const weekType = weeks[0]?.label?.includes('-') ? 'pre' : weeks[0]?.label?.match(/\d+/) ? 'pro' : undefined;
    const html = buildPlanificacionHTMLForPDF(project, weeks, DAYS, parseYYYYMMDD, addDays, weekType);
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '1123px';
    document.body.appendChild(tempContainer);

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(tempContainer, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1123,
      height: 794,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1123,
      windowHeight: 794,
      ignoreElements: () => {
        return false;
      },
      onclone: (clonedDoc) => {
        const footer = clonedDoc.querySelector('.footer') as HTMLElement;
        if (footer) {
          footer.style.position = 'relative';
          footer.style.display = 'flex';
          footer.style.visibility = 'visible';
          footer.style.opacity = '1';
          console.log('🔧 Planificación PDF: Footer styles applied in cloned document');
        } else {
          console.log('❌ Planificación PDF: Footer not found in cloned document');
        }
      }
    });

    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

    const projectName = project?.nombre || i18n.t('common.project');
    
    // Helper to get translation for filename
    const getFilenameTranslation = (key: string, fallback: string): string => {
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
    };
    
    // Get planning label
    const planningLabel = i18n?.store?.data?.[i18n?.language || 'es']?.translation?.common?.planning || 
                          (i18n?.language === 'en' ? 'Planning' : i18n?.language === 'ca' ? 'Planificació' : 'Planificacion');
    
    // Extract week number from label (e.g., "Semana 1" -> "Semana1", "Week -1" -> "Week-1")
    const weekLabel = weeks[0]?.label || '';
    const weekMatch = weekLabel.match(/(Semana|Week|Setmana)\s*(-?\d+)/i);
    let weekPart = '';
    if (weekMatch) {
      const weekWord = weekMatch[1];
      const weekNumber = weekMatch[2];
      // Translate week word
      const weekWordTranslated = getFilenameTranslation('planning.week', weekWord);
      weekPart = `${weekWordTranslated}${weekNumber}`;
    } else {
      // Fallback: use label as is
      weekPart = weekLabel.replace(/\s+/g, '');
    }
    
    const filename = `${planningLabel}_${weekPart}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    pdf.save(filename);
    console.log(`✅ Planificación PDF: Saved as ${filename}`);
  } catch (error) {
    console.error('Error generating PDF for planificación:', error);
    throw error;
  }
}

export async function exportAllToPDF(
  project: any,
  allWeeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date,
  scope?: 'pre' | 'pro'
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < allWeeks.length; i++) {
      const week = allWeeks[i];
      // For PDF Entero (scope = undefined), detect week type automatically
      // Detect by week number: negative = preproducción, positive = producción
      const weekType = scope === undefined 
        ? (week.label?.includes('-') ? 'pre' : week.label?.match(/\d+/) ? 'pro' : undefined)
        : scope;
      const weekHTML = buildPlanificacionHTMLForPDF(
        project,
        [week],
        DAYS,
        parseYYYYMMDD,
        addDays,
        weekType
      );

      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = weekHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1123px';
      document.body.appendChild(tempContainer);

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1123,
        windowHeight: 794,
        ignoreElements: () => {
          return false;
        },
        onclone: (clonedDoc) => {
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            console.log(`🔧 Planificación PDF All - Page ${i + 1}: Footer styles applied in cloned document`);
          } else {
            console.log(`❌ Planificación PDF All - Page ${i + 1}: Footer not found in cloned document`);
          }
        }
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

      console.log(`📄 Planificación PDF All: Page ${i + 1}/${allWeeks.length} generated`);
    }

    const projectName = project?.nombre || i18n.t('common.project');
    
    // Helper to get translation for filename
    const getFilenameTranslation = (key: string, fallback: string): string => {
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
    };
    
    // Get planning label
    const planningLabel = i18n?.store?.data?.[i18n?.language || 'es']?.translation?.common?.planning || 
                          (i18n?.language === 'en' ? 'Planning' : i18n?.language === 'ca' ? 'Planificació' : 'Planificacion');
    
    // Determine scope label based on scope parameter
    let scopeLabel = '';
    if (scope === 'pre') {
      scopeLabel = getFilenameTranslation('planning.preproduction', 'Preproduccion');
    } else if (scope === 'pro') {
      scopeLabel = getFilenameTranslation('planning.production', 'Produccion');
    } else {
      // scope === undefined means "all" or "completa"
      scopeLabel = getFilenameTranslation('planning.complete', 'Completa');
    }
    
    const filename = `${planningLabel}_${scopeLabel}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    pdf.save(filename);
    console.log(`✅ Planificación PDF All: ${allWeeks.length} pages saved as ${filename}`);
  } catch (error) {
    console.error('Error generating PDF for all planificación:', error);
    throw error;
  }
}
