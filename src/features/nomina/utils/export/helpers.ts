import i18n from '../../../../i18n/config';
import { hasRoleGroupSuffix, stripRoleSuffix } from '@shared/constants/roles';

/**
 * Escape HTML special characters
 */
export function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as const)[c as '&' | '<' | '>']
  );
}

/**
 * Display empty string for zero values
 */
export const displayValue = (value: number | undefined | null, decimals: number = 0): string => {
  if (value === null || value === undefined || value === 0) return '';
  // Si el valor es entero, mostrarlo sin decimales
  if (value % 1 === 0) return String(value);
  // Si tiene decimales, mostrar con el número de decimales especificado
  return decimals > 0 ? value.toFixed(decimals) : String(value);
};

/**
 * Display monetary values with € symbol (removes .00 if no decimals)
 */
export const displayMoney = (value: number | undefined | null, decimals: number = 2): string => {
  if (value === null || value === undefined || value === 0) return '';
  const formatted = value.toFixed(decimals);
  const cleaned = formatted.replace(/\.00$/, '');
  return `${cleaned}€`;
};

/**
 * Translate diet item names
 */
const translateDietItem = (item: string): string => {
  const itemMap: Record<string, string> = {
    'Comida': i18n.t('payroll.dietOptions.lunch'),
    'Cena': i18n.t('payroll.dietOptions.dinner'),
    'Dieta sin pernoctar': i18n.t('payroll.dietOptions.dietNoOvernight'),
    'Dieta con pernocta': i18n.t('payroll.dietOptions.dietWithOvernight'),
    'Gastos de bolsillo': i18n.t('payroll.dietOptions.pocketExpenses'),
    'Ticket': i18n.t('payroll.dietOptions.ticket'),
    'Otros': i18n.t('payroll.dietOptions.other'),
  };
  return itemMap[item] || item;
};

/**
 * Generate worked days summary text for export
 */
export const generateWorkedDaysText = (r: any): string => {
  const parts: string[] = [];
  
  // Orden: Localizar, Oficina, Carga, Rodaje, Prelight, Recogida, Descarga
  if ((r._localizar || 0) > 0) {
    parts.push(`${i18n.t('payroll.dayTypes.location')} x${r._localizar}`);
  }
  
  if ((r._oficina || 0) > 0) {
    parts.push(`${i18n.t('payroll.dayTypes.office')} x${r._oficina}`);
  }
  
  if ((r._carga || 0) > 0) {
    parts.push(`${i18n.t('payroll.dayTypes.loading')} x${r._carga}`);
  }
  
  if ((r._rodaje || 0) > 0) {
    parts.push(`${i18n.t('payroll.dayTypes.shooting')} x${r._rodaje}`);
  }
  if ((r._pruebasCamara || 0) > 0) {
    parts.push(`${i18n.t('payroll.dayTypes.cameraTests')} x${r._pruebasCamara}`);
  }
  
  if ((r._prelight || 0) > 0) {
    parts.push(`${i18n.t('payroll.dayTypes.prelight', 'Prelight')} x${r._prelight}`);
  }
  
  if ((r._recogida || 0) > 0) {
    parts.push(`${i18n.t('payroll.dayTypes.pickup', 'Recogida')} x${r._recogida}`);
  }
  
  if ((r._descarga || 0) > 0) {
    parts.push(`${i18n.t('payroll.dayTypes.unloading')} x${r._descarga}`);
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  const totalWorked = r._worked || 0;
  return `<div style="text-align:center;"><strong>${totalWorked}</strong><br/><div style="font-size:10px;line-height:1.2;">${parts.join('<br/>')}</div></div>`;
};

/**
 * Generate carga/descarga summary text for export (diario)
 */
export const generateCargaDescargaText = (r: any): string => {
  const carga = r._cargaDays || 0;
  const descarga = r._descargaDays || 0;
  const total = carga + descarga;
  if (total === 0) return '';
  const parts: string[] = [];
  if (carga > 0) parts.push(`${i18n.t('payroll.dayTypes.loading')} x${carga}`);
  if (descarga > 0) parts.push(`${i18n.t('payroll.dayTypes.unloading')} x${descarga}`);
  return `<div style="text-align:center;"><strong>${total}</strong><br/><div style="font-size:10px;line-height:1.2;">${parts.join('<br/>')}</div></div>`;
};

/**
 * Generate dietas summary text for export
 */
export const generateDietasText = (r: any): string => {
  const want = [
    'Comida',
    'Cena',
    'Dieta sin pernoctar',
    'Dieta con pernocta',
    'Gastos de bolsillo',
    'Ticket',
    'Otros',
  ];
  const parts: string[] = [];
  let totalDietas = 0;
  
  for (const label of want) {
    if (label === 'Ticket') {
      if (r.ticketTotal > 0) {
        parts.push(`${translateDietItem('Ticket')} ${r.ticketTotal.toFixed(2)}€`);
        totalDietas += 1; // Contar ticket como 1 dieta
      }
    } else if (label === 'Otros') {
      if ((r.otherTotal || 0) > 0) {
        parts.push(`${translateDietItem('Otros')} ${Number(r.otherTotal || 0).toFixed(2)}€`);
        totalDietas += 1; // Contar otros como 1 dieta
      }
    } else {
      const cnt = r.dietasCount?.get(label) || 0;
      if (cnt > 0) {
        parts.push(`${translateDietItem(label)} x${cnt}`);
        totalDietas += cnt;
      }
    }
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  return `<div style="text-align:center;"><strong>${totalDietas}</strong><br/><div style="font-size:9px;line-height:1.2;">${parts.join('<br/>')}</div></div>`;
};

/**
 * Generate extras summary text for export
 */
export const generateExtrasText = (r: any): string => {
  const totalExtras = (r.horasExtra || 0) + (r.turnAround || 0) + (r.nocturnidad || 0) + (r.penaltyLunch || 0);
  const parts: string[] = [];
  
  if ((r.horasExtra || 0) > 0) {
    parts.push(`<div>${i18n.t('payroll.concepts.extraHours')} x${r.horasExtra}</div>`);
  }
  
  if ((r.turnAround || 0) > 0) {
    parts.push(`<div>${i18n.t('payroll.concepts.turnAround')} x${r.turnAround}</div>`);
  }
  
  if ((r.nocturnidad || 0) > 0) {
    parts.push(`<div class="nocturnidad">${i18n.t('payroll.concepts.nightShift')} x${r.nocturnidad}</div>`);
  }
  
  if ((r.penaltyLunch || 0) > 0) {
    parts.push(`<div>${i18n.t('payroll.concepts.penaltyLunch')} x${r.penaltyLunch}</div>`);
  }
  
  if (parts.length === 0 || totalExtras === 0) {
    return '';
  }
  
  return `<div style="text-align:center;"><strong>${totalExtras}</strong><br/>${parts.join(' ')}</div>`;
};

/**
 * Get column visibility based on data
 */
export const getColumnVisibility = (enrichedRows: any[]) => {
  return {
    localizacion: enrichedRows.some(r => (r._localizarDays || 0) > 0 || (r._totalLocalizacion || 0) > 0),
    cargaDescarga: enrichedRows.some(r => (r._cargaDays || 0) > 0 || (r._descargaDays || 0) > 0 || (r._totalCargaDescarga || 0) > 0),
    holidays: enrichedRows.some(r => (r._holidays || 0) > 0),
    travel: enrichedRows.some(r => (r._travel || 0) > 0),
    extras: enrichedRows.some(r => (r.extras || 0) > 0),
    materialPropio: enrichedRows.some(r => (r._materialPropioDays || 0) > 0 || (r._materialPropioWeeks || 0) > 0 || (r._totalMaterialPropio || 0) > 0),
    transporte: enrichedRows.some(r => (r.transporte || 0) > 0),
    km: enrichedRows.some(r => (r.km || 0) > 0),
    dietas: enrichedRows.some(r => (r._totalDietas || 0) > 0),
  };
};

/**
 * Get block from role (base, pre, pick)
 */
export const getBlockFromRole = (role: string): 'base' | 'pre' | 'pick' => {
  const roleUpper = String(role || '').toUpperCase();
  if (hasRoleGroupSuffix(roleUpper) && roleUpper.endsWith('P')) return 'pre';
  if (hasRoleGroupSuffix(roleUpper) && roleUpper.endsWith('R')) return 'pick';
  return 'base';
};

/**
 * Get base role priority for sorting
 */
const getBaseRolePriority = (role: string): number => {
  const baseRole = stripRoleSuffix(role).toUpperCase().trim();
  
  if (baseRole === 'G') return 0;
  if (baseRole === 'BB') return 1;
  if (baseRole === 'E') return 2;
  if (baseRole === 'TM') return 3;
  if (baseRole === 'FB') return 4;
  if (baseRole === 'AUX') return 5;
  if (baseRole === 'M') return 6;
  if (baseRole === 'RG') return 7;
  if (baseRole === 'RBB') return 8;
  if (baseRole === 'RE') return 9;
  if (baseRole === 'TG') return 10;
  if (baseRole === 'EPO') return 11;
  if (baseRole === 'TP') return 12;
  if (baseRole === 'RIG') return 9;
  if (baseRole === 'REF') return 14;
  
  return 1000;
};

/**
 * Sort rows by role hierarchy within a block
 */
export const sortRowsByRole = (rows: any[], block: 'base' | 'pre' | 'pick') => {
  return rows.sort((a, b) => {
    const roleA = String(a.role || '').toUpperCase();
    const roleB = String(b.role || '').toUpperCase();
    
    // Para bloques pre y pick, separar REF del resto
    if (block === 'pre' || block === 'pick') {
      // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), tratarlo como refuerzo
      const isRefA = roleA === 'REF' || (roleA && roleA.startsWith('REF') && roleA.length > 3);
      const isRefB = roleB === 'REF' || (roleB && roleB.startsWith('REF') && roleB.length > 3);
      
      // REF siempre al final dentro de su bloque
      if (isRefA && !isRefB) return 1;
      if (!isRefA && isRefB) return -1;
      
      // Si ambos son REF o ambos no son REF, ordenar por nombre
      if (isRefA && isRefB) {
        return String(a.name || '').localeCompare(String(b.name || ''));
      }
      
      // Ambos no son REF: ordenar por jerarquía del rol base
      const priorityA = getBaseRolePriority(roleA);
      const priorityB = getBaseRolePriority(roleB);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
    } else {
      // Para bloque base, ordenar por jerarquía normal
      const priorityA = getBaseRolePriority(roleA);
      const priorityB = getBaseRolePriority(roleB);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
    }
    
    // Si misma prioridad, ordenar por nombre
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
};

