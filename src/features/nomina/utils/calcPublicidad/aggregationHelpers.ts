import { loadCondModel } from '../cond';
import { ROLE_CODE_TO_LABEL, ROLE_CODES_WITH_PR_SUFFIX, hasRoleGroupSuffix, stripRoleSuffix } from '@shared/constants/roles';
import { stripPR, buildRefuerzoIndex } from '../plan';
import { storageKeyFor } from './helpers';

/**
 * Normalize role name for comparison
 */
const normalizeLabel = (s: unknown): string =>
  String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const KNOWN_LABELS = new Set(
  [
    'Gaffer',
    'Best boy',
    'Eléctrico',
    'Eléctrico/a',
    'Auxiliar',
    'Meritorio',
    'Técnico de mesa',
    'Finger boy',
    'Rigger',
    'Rigging Gaffer',
    'Rigging Best Boy',
    'Rigging Eléctrico',
    'Técnico de Generador',
    'Eléctrico de potencia',
    'Técnico de prácticos',
  ].map(normalizeLabel)
);

function normalizeRoleName(roleName: string): string {
  const raw = String(roleName || '');
  const upper = raw.toUpperCase();
  const roleNorm = normalizeLabel(raw);
  const shouldStrip = /[PR]$/i.test(raw) && !ROLE_CODES_WITH_PR_SUFFIX.has(upper) && !KNOWN_LABELS.has(roleNorm);
  const cleaned = shouldStrip ? raw.replace(/[PR]$/i, '') : raw;
  return cleaned
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
  // Si el rol empieza con "REF" (REFG, REFBB, etc.), tratarlo como refuerzo
  if (roleCode && roleCode.startsWith('REF') && roleCode.length > 3) {
    return 'REF';
  }
  const base = stripRoleSuffix(roleCode || '');
  const keyNoPR = `${base}__${name || ''}`;
  if (refuerzoSet.has(keyNoPR)) return 'REF';
  const suffix = hasRoleGroupSuffix(roleCode || '') ? roleCode.slice(-1) : '';
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
  G: 0, BB: 1, E: 2, TM: 3, FB: 4, AUX: 5, M: 6, RIG: 7,
  // REFUERZOS
  REF: 8,
  // EQUIPO PRELIGHT
  GP: 9, BBP: 10, EP: 11, TMP: 12, FBP: 13, AUXP: 14, MP: 15, RIGP: 16,
  // EQUIPO RECOGIDA
  GR: 17, BBR: 18, ER: 19, TMR: 20, FBR: 21, AUXR: 22, MR: 23, RIGR: 24
};

