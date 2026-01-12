import { RowIn } from '../MonthSectionTypes';

/**
 * Get visible role for filtered data lookup
 */
function getVisibleRoleForFilter(
  role: string,
  refuerzoSet: Set<string>,
  keyNoPR: string,
  stripPR: (r: string) => string
): string {
  if (refuerzoSet.has(keyNoPR)) {
    return 'REF';
  }
  // visibleRoleFor devuelve el role base con sufijo P/R si existe
  const baseRole = stripPR(role);
  const suffix = /[PR]$/.test(role || '') ? role.slice(-1) : '';
  return suffix ? `${baseRole}${suffix}` : baseRole;
}

/**
 * Get filtered row data if available
 */
export function getFilteredRowData(
  r: RowIn,
  filteredData: Map<string, any> | null,
  dateFrom: string,
  dateTo: string,
  refuerzoSet: Set<string>,
  stripPR: (r: string) => string
): any | null {
  const keyNoPRForFilter = `${stripPR(r.role)}__${r.name}`;
  const visibleRoleForFilter = getVisibleRoleForFilter(r.role, refuerzoSet, keyNoPRForFilter, stripPR);
  const filteredKey = `${visibleRoleForFilter}__${r.name}`;
  
  // Verificar que las fechas no estén vacías (string vacío no cuenta como fecha válida)
  const hasDateFilter =
    dateFrom &&
    dateTo &&
    dateFrom.trim() !== '' &&
    dateTo.trim() !== '' &&
    filteredData;
  
  if (!hasDateFilter) {
    return null;
  }
  
  return filteredData?.get(filteredKey) || null;
}

/**
 * Get value from override, filtered data, or original row
 */
export function getValueWithOverride<T>(
  ov: any,
  key: string,
  useFilteredData: boolean,
  filteredRow: any,
  originalValue: T
): T {
  // Check override first
  if (ov && typeof ov === 'object' && key in ov && ov[key] !== undefined) {
    return ov[key];
  }
  // Then check filtered data
  // Si filteredRow tiene la clave y el valor no es undefined, usarlo
  // Pero si el valor original no es 0 y filteredRow[key] es 0, usar el original
  // (porque 0 en filteredRow podría significar "no hay datos filtrados" para ese concepto)
  if (useFilteredData && filteredRow && typeof filteredRow === 'object' && key in filteredRow) {
    const filteredValue = filteredRow[key];
    // Si filteredValue es undefined o null, usar el valor original
    if (filteredValue === undefined || filteredValue === null) {
      return originalValue;
    }
    // Si el valor original no es 0 y filteredValue es 0, usar el original
    // (esto es especialmente importante para penaltyLunch y otros campos que pueden ser 0 en filteredRow)
    if (originalValue !== 0 && filteredValue === 0 && typeof originalValue === 'number' && typeof filteredValue === 'number') {
      return originalValue;
    }
    return filteredValue;
  }
  // Fallback to original value
  return originalValue;
}

