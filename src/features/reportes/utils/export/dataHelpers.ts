import { parseDietas } from '../text';

/**
 * Helper function to calculate total for a concept
 */
export const calculateTotalForExport = (
  data: any,
  pKey: string,
  concepto: string,
  semana: string[],
  forPDF: boolean = false
): number | string | { breakdown: Map<string, number> } => {
  if (concepto === 'Dietas') {
    if (forPDF) {
      // Para PDF, contar cada tipo de dieta por separado
      const breakdown = new Map<string, number>();
      semana.forEach(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        if (val && val.toString().trim() !== '') {
          const parsed = parseDietas(val);
          parsed.items.forEach(item => {
            if (item !== 'Ticket') {
              breakdown.set(item, (breakdown.get(item) || 0) + 1);
            }
          });
          if (parsed.ticket !== null) {
            breakdown.set('Ticket', (breakdown.get('Ticket') || 0) + 1);
          }
        }
      });
      return breakdown.size > 0 ? { breakdown } : '';
    } else {
      // Para HTML, contar el número de días con dietas
      let count = 0;
      semana.forEach(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        if (val && val.toString().trim() !== '') {
          count++;
        }
      });
      return count > 0 ? count : '';
    }
  }

  if (concepto === 'Transporte' || concepto === 'Nocturnidad' || concepto === 'Penalty lunch') {
    // Para conceptos SI/NO, contar cuántos "Sí" hay
    let count = 0;
    semana.forEach(fecha => {
      const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
      if (val && (val.toString().trim().toLowerCase() === 'sí' || val.toString().trim().toLowerCase() === 'si')) {
        count++;
      }
    });
    return count > 0 ? count : '';
  }

  // Para conceptos numéricos, sumar todos los valores
  let total = 0;
  semana.forEach(fecha => {
    const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
    if (val && val.toString().trim() !== '') {
      const num = Number(val);
      if (!isNaN(num)) {
        total += num;
      }
    }
  });
  return total > 0 ? total : '';
};

/**
 * Role hierarchy for sorting (same as in derive.ts)
 */
export const rolePriorityForReports = (role: string = ''): number => {
  const r = String(role).toUpperCase().trim();
  
  // EQUIPO BASE
  if (r === 'G') return 0;
  if (r === 'BB') return 1;
  if (r === 'E') return 2;
  if (r === 'TM') return 3;
  if (r === 'FB') return 4;
  if (r === 'AUX') return 5;
  if (r === 'M') return 6;
  if (r === 'RIG') return 7;
  
  // REFUERZOS
  if (r === 'REF' || (r.startsWith('REF') && r.length > 3)) return 8;
  
  // EQUIPO PRELIGHT
  if (r === 'GP') return 9;
  if (r === 'BBP') return 10;
  if (r === 'EP') return 11;
  if (r === 'TMP') return 12;
  if (r === 'FBP') return 13;
  if (r === 'AUXP') return 14;
  if (r === 'MP') return 15;
  if (r === 'RIGP') return 16;
  
  // EQUIPO RECOGIDA
  if (r === 'GR') return 17;
  if (r === 'BBR') return 18;
  if (r === 'ER') return 19;
  if (r === 'TMR') return 20;
  if (r === 'FBR') return 21;
  if (r === 'AUXR') return 22;
  if (r === 'MR') return 23;
  if (r === 'RIGR') return 24;
  
  // Roles desconocidos al final
  return 1000;
};

/**
 * Deduplicate data by role and name
 */
export const deduplicateData = (data: any): any => {
  const roleNameMap = new Map();
  const deduplicatedData: any = {};
  
  Object.keys(data || {}).forEach(k => {
    const [rolePart, ...nameParts] = String(k).split('__');
    const role = rolePart || '';
    const name = nameParts.join('__') || '';
    const key = `${role}__${name}`;
    
    // Skip completely empty keys (role fantasma)
    if (!role && !name) {
      return;
    }
    
    if (roleNameMap.has(key)) {
      
      // Merge data from duplicate into original
      const originalKey = roleNameMap.get(key);
      if (data[k] && data[originalKey]) {
        // Merge concept data
        Object.keys(data[k]).forEach(concept => {
          if (!data[originalKey][concept]) {
            data[originalKey][concept] = {};
          }
          Object.keys(data[k][concept]).forEach(date => {
            if (data[k][concept][date] && !data[originalKey][concept][date]) {
              data[originalKey][concept][date] = data[k][concept][date];
            }
          });
        });
      }
    } else {
      roleNameMap.set(key, k);
      deduplicatedData[k] = data[k];
    }
  });
  
  return Object.keys(deduplicatedData).length > 0 ? deduplicatedData : data;
};

/**
 * Sort person keys by role hierarchy
 */
export const sortPersonKeysByRole = (personKeys: string[]): string[] => {
  return personKeys.sort((a, b) => {
    const [roleA] = String(a).split('__');
    const [roleB] = String(b).split('__');
    const priorityA = rolePriorityForReports(roleA);
    const priorityB = rolePriorityForReports(roleB);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by name
    const [, ...namePartsA] = String(a).split('__');
    const [, ...namePartsB] = String(b).split('__');
    const nameA = namePartsA.join('__');
    const nameB = namePartsB.join('__');
    return nameA.localeCompare(nameB);
  });
};

/**
 * Check if a value is meaningful (not empty, 0, or just spaces)
 */
export const isMeaningfulValue = (value: any): boolean => {
  if (!value) return false;
  const trimmedValue = value.toString().trim();
  if (trimmedValue === '') return false;
  if (trimmedValue === '0') return false;
  if (trimmedValue === '0.0') return false;
  if (trimmedValue === '0,0') return false;
  return true;
};

/**
 * Filter concepts that have meaningful data
 */
export const filterConceptsWithData = (
  CONCEPTS: string[],
  personKeys: string[],
  safeSemana: string[],
  data: any
): string[] => {
  return CONCEPTS.filter(concepto => {
    return personKeys.some(pk => {
      return safeSemana.some(iso => {
        const value = data?.[pk]?.[concepto]?.[iso];
        return isMeaningfulValue(value);
      });
    });
  });
};

/**
 * Filter persons that have meaningful data
 */
export const filterPersonsWithData = (
  personKeys: string[],
  safeSemana: string[],
  concepts: string[],
  data: any
): string[] => {
  return personKeys.filter(pk => {
    return safeSemana.some(iso => {
      return concepts.some(concepto => {
        const value = data?.[pk]?.[concepto]?.[iso];
        return isMeaningfulValue(value);
      });
    });
  });
};

/**
 * Filter days that are not DESCANSO or have data
 */
export const filterDaysWithData = (
  safeSemana: string[],
  horarioTexto: (iso: string) => string,
  personKeys: string[],
  CONCEPTS: string[],
  data: any
): string[] => {
  return safeSemana.filter(iso => {
    const dayLabel = horarioTexto(iso);
    // Si es DESCANSO, verificar si tiene datos
    if (dayLabel === 'DESCANSO') {
      return personKeys.some(pk => {
        return CONCEPTS.some(concepto => {
          const value = data?.[pk]?.[concepto]?.[iso];
          return isMeaningfulValue(value);
        });
      });
    }
    return true; // No es DESCANSO, incluirlo
  });
};

