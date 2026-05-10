import { loadCondModel } from '@features/nomina/utils/cond';
import { ROLE_CODE_TO_LABEL, stripRefuerzoSuffix, stripRoleSuffix } from '@shared/constants/roles';
import type { AnyRecord } from '@shared/types/common';
import { parsePersonKey } from './export/dataHelpers';

type CondMode = 'semanal' | 'mensual' | 'diario';

function parseNum(v: unknown): number {
  if (v == null || v === '') return 0;
  const s = String(v)
    .trim()
    .replace(/\u00A0/g, '')
    .replace(/[€%]/g, '')
    .replace(/\s+/g, '');
  const t =
    s.includes(',') && s.includes('.')
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(',', '.');
  const n = Number(t);
  return isFinite(n) ? n : 0;
}

function normalizeLabel(s: unknown): string {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * True si en condiciones del proyecto ese rol tiene importe de «Material propio» (> 0).
 * Alineado con la lógica de filas de precios en ReportesSemana (sin resolver roster).
 */
export function materialPropioActiveFromConditions(
  project: AnyRecord | undefined,
  mode: CondMode,
  pk: string
): boolean {
  const model = loadCondModel(project as AnyRecord, mode);
  const priceTables = {
    base: model?.prices || {},
    pre: model?.pricesPrelight || {},
    pick: model?.pricesPickup || {},
  };

  const { role, block: rawBlock } = parsePersonKey(pk);
  const block: 'base' | 'pre' | 'pick' | 'extra' = String(rawBlock).startsWith('extra')
    ? 'extra'
    : rawBlock === 'pre'
      ? 'pre'
      : rawBlock === 'pick'
        ? 'pick'
        : 'base';

  const priceRows =
    block === 'pre' ? priceTables.pre : block === 'pick' ? priceTables.pick : priceTables.base;

  const rawRole = String(role || '');
  let baseRole = stripRoleSuffix(rawRole);
  if (baseRole.startsWith('REF')) {
    const cleaned = stripRefuerzoSuffix(baseRole);
    baseRole = cleaned.startsWith('REF') ? cleaned.substring(3) : cleaned;
  }
  const fallbackRoleLabel = ROLE_CODE_TO_LABEL[baseRole as keyof typeof ROLE_CODE_TO_LABEL] || baseRole;
  const roleIdHint =
    rawRole.includes('_') ||
    rawRole.includes('-') ||
    (rawRole.length > 0 && rawRole.toLowerCase() === rawRole && /[a-z]/.test(rawRole))
      ? rawRole
      : undefined;

  const candidates = [roleIdHint, fallbackRoleLabel, baseRole, rawRole].filter(Boolean);
  const candNorms = candidates.map(c => normalizeLabel(c));

  let row: AnyRecord | null = null;
  for (const key of Object.keys(priceRows || {})) {
    if (candNorms.includes(normalizeLabel(key))) {
      row = priceRows[key];
      break;
    }
  }
  if (!row) return false;
  return parseNum(row['Material propio']) > 0;
}

export function createAdjustConceptsForMaterialPropioExport(
  project: AnyRecord | undefined,
  mode: CondMode
): (pk: string, baseConcepts: readonly string[]) => string[] {
  return (pk: string, baseConcepts: readonly string[]) =>
    materialPropioActiveFromConditions(project, mode, pk)
      ? [...baseConcepts]
      : baseConcepts.filter(c => c !== 'Material propio');
}
