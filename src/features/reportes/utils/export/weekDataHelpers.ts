import { storage } from '@shared/services/localStorage.service';
import { personaKey } from '../model';
import { CONCEPTS } from '../../constants';

interface PrepareWeekDataParams {
  project: any;
  weekDays: string[];
  safePersonas: any[];
}

/**
 * Prepare week data structure for export
 */
export function prepareWeekData({
  project,
  weekDays,
  safePersonas,
}: PrepareWeekDataParams): any {
  const baseId = project?.id || project?.nombre || 'tmp';
  const weekKey = `reportes_${baseId}_${weekDays.join('_')}`;
  
  let weekData: any = {};
  try {
    weekData = storage.getJSON<any>(weekKey) || {};
  } catch (e) {
    console.error('Error loading week data:', e);
  }

  // Ensure all personas have data structure
  safePersonas.forEach(p => {
    const key = personaKey(p);
    if (!weekData[key]) {
      weekData[key] = {};
    }
    CONCEPTS.forEach(concepto => {
      if (!weekData[key][concepto]) {
        weekData[key][concepto] = {};
      }
      weekDays.forEach(day => {
        if (weekData[key][concepto][day] === undefined) {
          weekData[key][concepto][day] = '';
        }
      });
    });
  });

  return weekData;
}

