import { parseDietas } from '../text';
import { norm } from '../text';

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
 * IMPORTANTE: Para refuerzos, detectar duplicados incluso si tienen diferentes formatos (REF vs REFE, REF.pre__ vs REF__)
 */
export const deduplicateData = (data: any): any => {
  const roleNameMap = new Map<string, string>(); // key normalizado -> clave original
  const deduplicatedData: any = {};
  
  Object.keys(data || {}).forEach(k => {
    if (String(k).startsWith('__')) return;
    // Parsear la clave: puede ser "role__name", "role.pre__name", "role.pick__name"
    let role = '';
    let name = '';
    let block = '';
    
    if (k.includes('.pre__')) {
      const [rolePart, ...nameParts] = k.split('.pre__');
      role = rolePart || '';
      name = nameParts.join('.pre__') || '';
      block = 'pre';
    } else if (k.includes('.pick__')) {
      const [rolePart, ...nameParts] = k.split('.pick__');
      role = rolePart || '';
      name = nameParts.join('.pick__') || '';
      block = 'pick';
    } else {
      const [rolePart, ...nameParts] = k.split('__');
      role = rolePart || '';
      name = nameParts.join('__') || '';
      block = 'base';
    }
    
    // Skip completely empty keys (role fantasma)
    if (!role && !name) {
      return;
    }
    
    // Normalizar nombre para comparación
    const normalizedName = norm(name);
    
    // Para refuerzos, normalizar el rol: REF, REFE, REFG, etc. -> comparar solo por nombre
    // Si es refuerzo, usar solo el nombre normalizado como clave de deduplicación
    const isRefuerzo = role === 'REF' || (role.startsWith('REF') && role.length > 3);
    const dedupKey = isRefuerzo 
      ? `REF__${normalizedName}` // Todos los refuerzos se agrupan por nombre
      : `${role}__${normalizedName}`; // Roles normales: rol + nombre
    
    if (roleNameMap.has(dedupKey)) {
      // Duplicado encontrado
      const originalKey = roleNameMap.get(dedupKey)!;
      
      // Para refuerzos, preferir el código completo (REFE) sobre REF genérico
      if (isRefuerzo) {
        const originalRole = originalKey.includes('.pre__') 
          ? originalKey.split('.pre__')[0]
          : originalKey.includes('.pick__')
          ? originalKey.split('.pick__')[0]
          : originalKey.split('__')[0];
        
        // Si el original es REF genérico y este es código completo, reemplazar
        if (originalRole === 'REF' && role !== 'REF' && role.startsWith('REF')) {
          // Eliminar el original y usar este
          delete deduplicatedData[originalKey];
          roleNameMap.set(dedupKey, k);
          deduplicatedData[k] = data[k];
          // Merge data del original al nuevo
          if (data[originalKey]) {
            Object.keys(data[originalKey] || {}).forEach(concept => {
              if (!deduplicatedData[k][concept]) {
                deduplicatedData[k][concept] = {};
              }
              Object.keys(data[originalKey][concept] || {}).forEach(date => {
                if (data[originalKey][concept][date] && !deduplicatedData[k][concept][date]) {
                  deduplicatedData[k][concept][date] = data[originalKey][concept][date];
                }
              });
            });
          }
          return;
        }
        // Si este es REF genérico y el original es código completo, ignorar este
        if (role === 'REF' && originalRole !== 'REF' && originalRole.startsWith('REF')) {
          // Merge data de este al original
          if (data[k] && deduplicatedData[originalKey]) {
            Object.keys(data[k] || {}).forEach(concept => {
              if (!deduplicatedData[originalKey][concept]) {
                deduplicatedData[originalKey][concept] = {};
              }
              Object.keys(data[k][concept] || {}).forEach(date => {
                if (data[k][concept][date] && !deduplicatedData[originalKey][concept][date]) {
                  deduplicatedData[originalKey][concept][date] = data[k][concept][date];
                }
              });
            });
          }
          return; // Ignorar este duplicado
        }
      }
      
      // Merge data from duplicate into original
      if (data[k] && deduplicatedData[originalKey]) {
        Object.keys(data[k] || {}).forEach(concept => {
          if (!deduplicatedData[originalKey][concept]) {
            deduplicatedData[originalKey][concept] = {};
          }
          Object.keys(data[k][concept] || {}).forEach(date => {
            if (data[k][concept][date] && !deduplicatedData[originalKey][concept][date]) {
              deduplicatedData[originalKey][concept][date] = data[k][concept][date];
            }
          });
        });
      }
    } else {
      roleNameMap.set(dedupKey, k);
      deduplicatedData[k] = data[k];
    }
  });
  
  return Object.keys(deduplicatedData).length > 0 ? deduplicatedData : data;
};

/**
 * Sort person keys by role hierarchy
 * IMPORTANTE: Mantener refuerzos juntos al final, ordenados por nombre
 */
export const sortPersonKeysByRole = (personKeys: string[]): string[] => {
  return personKeys.sort((a, b) => {
    // Parsear roles de las claves (pueden tener formato "role.pre__name" o "role__name")
    let roleA = '';
    let roleB = '';
    
    if (a.includes('.pre__')) {
      roleA = a.split('.pre__')[0];
    } else if (a.includes('.pick__')) {
      roleA = a.split('.pick__')[0];
    } else {
      roleA = a.split('__')[0];
    }
    
    if (b.includes('.pre__')) {
      roleB = b.split('.pre__')[0];
    } else if (b.includes('.pick__')) {
      roleB = b.split('.pick__')[0];
    } else {
      roleB = b.split('__')[0];
    }
    
    // Detectar si son refuerzos
    const isRefA = roleA === 'REF' || (roleA.startsWith('REF') && roleA.length > 3);
    const isRefB = roleB === 'REF' || (roleB.startsWith('REF') && roleB.length > 3);
    
    // REF siempre al final
    if (isRefA && !isRefB) return 1;
    if (!isRefA && isRefB) return -1;
    
    // Si ambos son REF, ordenar por nombre
    if (isRefA && isRefB) {
      let nameA = '';
      let nameB = '';
      
      if (a.includes('.pre__')) {
        nameA = a.split('.pre__')[1] || '';
      } else if (a.includes('.pick__')) {
        nameA = a.split('.pick__')[1] || '';
      } else {
        nameA = a.split('__').slice(1).join('__') || '';
      }
      
      if (b.includes('.pre__')) {
        nameB = b.split('.pre__')[1] || '';
      } else if (b.includes('.pick__')) {
        nameB = b.split('.pick__')[1] || '';
      } else {
        nameB = b.split('__').slice(1).join('__') || '';
      }
      
      return nameA.localeCompare(nameB);
    }
    
    // Ambos no son REF: ordenar por jerarquía
    const priorityA = rolePriorityForReports(roleA);
    const priorityB = rolePriorityForReports(roleB);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Si misma prioridad, ordenar por nombre
    let nameA = '';
    let nameB = '';
    
    if (a.includes('.pre__')) {
      nameA = a.split('.pre__')[1] || '';
    } else if (a.includes('.pick__')) {
      nameA = a.split('.pick__')[1] || '';
    } else {
      nameA = a.split('__').slice(1).join('__') || '';
    }
    
    if (b.includes('.pre__')) {
      nameB = b.split('.pre__')[1] || '';
    } else if (b.includes('.pick__')) {
      nameB = b.split('.pick__')[1] || '';
    } else {
      nameB = b.split('__').slice(1).join('__') || '';
    }
    
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

