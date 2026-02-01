import { useTranslation } from 'react-i18next';
import { personaKey as buildPersonaKey } from '../../utils/model';
import { extractNumericValue, formatHorasExtraDecimal } from '../../utils/runtime';
import { AnyRecord } from '@shared/types/common';

/**
 * Translate concept names
 */
export const translateConcept = (concepto: string, t: (key: string) => string): string => {
  const conceptMap: Record<string, string> = {
    'Horas extra': t('reports.concepts.extraHours'),
    'Turn Around': t('reports.concepts.turnAround'),
    'Nocturnidad': t('reports.concepts.nightShift'),
    'Penalty lunch': t('reports.concepts.penaltyLunch'),
    'Material propio': t('reports.concepts.ownMaterial'),
    'Dietas': t('reports.concepts.diets'),
    'Kilometraje': t('reports.concepts.mileage'),
    'Transporte': t('reports.concepts.transportation'),
  };
  return conceptMap[concepto] || concepto;
};

/**
 * Translate diet item names
 */
export const translateDietItem = (item: string, t: (key: string) => string): string => {
  const itemMap: Record<string, string> = {
    'Comida': t('reports.dietOptions.lunch'),
    'Cena': t('reports.dietOptions.dinner'),
    'Dieta sin pernoctar': t('reports.dietOptions.dietNoOvernight'),
    'Dieta con pernocta': t('reports.dietOptions.dietWithOvernight'),
    'Gastos de bolsillo': t('reports.dietOptions.pocketExpenses'),
    'Ticket': t('reports.dietOptions.ticket'),
    'Otros': t('reports.dietOptions.other'),
  };
  return itemMap[item] || item;
};

/**
 * Get persona key from role and name, considering block
 */
export const personaKeyFrom = (
  role: string,
  name: string,
  block: 'base' | 'pre' | 'pick' | string
): string => {
  const pLike: AnyRecord = { role, name };
  // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), usar lógica de refuerzo
  if (role === 'REF' || (role && role.startsWith('REF') && role.length > 3)) {
    if (block === 'pre') pLike.__block = 'pre';
    if (block === 'pick') pLike.__block = 'pick';
    if (block === 'extra') pLike.__block = 'extra';
  } else {
    if (block === 'pre') pLike.__block = 'pre';
    if (block === 'pick') pLike.__block = 'pick';
    if (block === 'extra') pLike.__block = 'extra';
  }
  return buildPersonaKey(pLike);
};

/**
 * Calculate total for a concept and person
 */
export const calculateTotal = (
  pKey: string,
  concepto: string,
  semana: readonly string[],
  data: AnyRecord,
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null; other: number | null },
  horasExtraTipo?: string
): number | string | { breakdown: Map<string, number> } => {
  if (concepto === 'Dietas') {
    // Para dietas, contar cada tipo de dieta por separado
    const breakdown = new Map<string, number>();
    semana.forEach(fecha => {
      const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
      if (val && val.toString().trim() !== '') {
        const parsed = parseDietas(val);
        // Contar cada item (excepto Ticket/Otros que se manejan por separado)
        parsed.items.forEach(item => {
          if (item !== 'Ticket' && item !== 'Otros') {
            breakdown.set(item, (breakdown.get(item) || 0) + 1);
          }
        });
        // Si hay ticket, contarlo también
        if (parsed.ticket !== null) {
          breakdown.set('Ticket', (breakdown.get('Ticket') || 0) + 1);
        }
        // Si hay otros, contarlo también
        if (parsed.other !== null) {
          breakdown.set('Otros', (breakdown.get('Otros') || 0) + 1);
        }
      }
    });
    return breakdown.size > 0 ? { breakdown } : '';
  }

  if (concepto === 'Transporte' || concepto === 'Nocturnidad' || concepto === 'Penalty lunch' || concepto === 'Material propio') {
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
  // Si es "Horas extra" y el tipo es de minutaje, extraer el valor decimal del formato
  const isHorasExtraFormatted = concepto === 'Horas extra' && 
    (horasExtraTipo === 'Hora Extra - Minutaje desde corte' || 
     horasExtraTipo === 'Hora Extra - Minutaje + Cortesía');
  
  let total = 0;
  semana.forEach(fecha => {
    const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
    if (val && val.toString().trim() !== '') {
      let num: number;
      if (isHorasExtraFormatted) {
        // Para formato decimal, extraer el valor numérico del formato "0.58 (35 ')"
        num = extractNumericValue(val);
      } else {
        // Para otros valores, usar Number directamente
        num = Number(val);
      }
      if (!isNaN(num)) {
        total += num;
      }
    }
  });
  
  // Si es horas extra con formato decimal, formatear el total
  if (isHorasExtraFormatted && total > 0) {
    return formatHorasExtraDecimal(total);
  }
  
  return total > 0 ? total : '';
};

