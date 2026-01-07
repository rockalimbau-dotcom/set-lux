import i18n from '../../../../i18n/config';
import { Week, DayInfo } from './types';
import { esc, getTranslation, translateJornadaType } from './helpers';

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

interface GenerateWeekTableParams {
  week: Week;
  DAYS: DayInfo[];
  parseYYYYMMDD: (dateStr: string) => Date;
  addDays: (date: Date, days: number) => Date;
}

/**
 * Generate week table HTML
 */
export function generateWeekTable({
  week,
  DAYS,
  parseYYYYMMDD,
  addDays,
}: GenerateWeekTableParams): string {
  const monday = parseYYYYMMDD(week.startDate);
  const dayNames = [0, 1, 2, 3, 4, 5, 6].map(getDayNameShort);
  
  const meaningfulDays = DAYS.map((_, i) => hasMeaningfulData(week.days?.[i]));
  const filteredDays = DAYS.filter((_, i) => meaningfulDays[i]);
  const filteredDateRow = filteredDays.map((_, i) => {
    const originalIndex = DAYS.findIndex((_, idx) => meaningfulDays[idx] && idx >= i);
    const dayDate = addDays(monday, originalIndex);
    const dayName = dayNames[originalIndex];
    const dayNumber = dayDate.getDate();
    return `${dayName} ${dayNumber}`;
  });
  
  const headDays = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">&nbsp;</th>
        ${filteredDateRow.map(d => `
          <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
            ${esc(d)}
          </th>`).join('')}
      </tr>`;

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

