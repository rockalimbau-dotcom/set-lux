import { loadCondModel } from '../cond';
import { ROLE_CODE_TO_LABEL } from '@shared/constants/roles';
import { stripPR, buildRefuerzoIndex } from '../plan';
import { storageKeyFor } from './helpers';

/**
 * Normalize role name for comparison
 */
function normalizeRoleName(roleName: string): string {
  return String(roleName || '')
    .replace(/[PR]$/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get roles in condiciones for diario mode
 */
export function getRolesInCondiciones(project: any): Set<string> {
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'diario'
    }
  };
  const model = loadCondModel(projectWithMode, 'diario');
  const priceRows = model?.prices || {};
  return new Set(Object.keys(priceRows).map(r => normalizeRoleName(r)));
}

/**
 * Check if a role code is in condiciones
 */
export function isRoleInCondiciones(roleCode: string, rolesInCondiciones: Set<string>): boolean {
  // Convertir código a nombre (ej: "BB" -> "Best boy")
  const roleName = ROLE_CODE_TO_LABEL[roleCode as keyof typeof ROLE_CODE_TO_LABEL] || roleCode;
  const normalized = normalizeRoleName(roleName);
  return rolesInCondiciones.has(normalized);
}

/**
 * Get visible role for a role code and name
 */
export function visibleRoleFor(roleCode: string, name: string, refuerzoSet: Set<string>): string {
  const base = stripPR(roleCode || '');
  const keyNoPR = `${base}__${name || ''}`;
  if (refuerzoSet.has(keyNoPR)) return 'REF';
  const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
  return suffix ? `${base}${suffix}` : base;
}

/**
 * Column candidates for report aggregation
 */
export const COL_CANDIDATES = {
  extras: ['Horas extra', 'Horas extras', 'HE'] as const,
  ta: ['Turn Around', 'TA'] as const,
  noct: ['Nocturnidad', 'Noct', 'Nocturnidades'] as const,
  dietas: ['Dietas', 'Dietas / Ticket', 'Ticket', 'Tickets'] as const,
  km: ['Kilometraje', 'KM', 'Km'] as const,
  transp: ['Transporte', 'Transportes'] as const,
  penalty: ['Penalty lunch', 'Penalty Lunch', 'Penalty', 'PL'] as const,
} as const;

/**
 * Role order for sorting
 */
export const ROLE_ORDER: Record<string, number> = { 
  // EQUIPO BASE
  G: 0, BB: 1, E: 2, TM: 3, FB: 4, AUX: 5, M: 6,
  // REFUERZOS
  REF: 7,
  // EQUIPO PRELIGHT
  GP: 8, BBP: 9, EP: 10, TMP: 11, FBP: 12, AUXP: 13, MP: 14,
  // EQUIPO RECOGIDA
  GR: 15, BBR: 16, ER: 17, TMR: 18, FBR: 19, AUXR: 20, MR: 21
};

