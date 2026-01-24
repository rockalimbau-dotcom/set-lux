import { AnyRecord } from '@shared/types/common';
import { roleRank, getRoleBadgeCode } from '@shared/constants/roles';

/**
 * Sort team by role rank and sequence
 */
export const sortTeam = (arr: AnyRecord[]): AnyRecord[] =>
  [...arr].sort((a, b) => {
    // Si el rol tiene prefijo "REF" (refuerzo), usar el rank del rol base
    const roleA = a.role?.startsWith('REF') && a.role.length > 3 ? a.role.substring(3) : a.role;
    const roleB = b.role?.startsWith('REF') && b.role.length > 3 ? b.role.substring(3) : b.role;
    const ra = roleRank(roleA);
    const rb = roleRank(roleB);
    if (ra !== rb) return ra - rb;
    const sa = a.seq ?? 0;
    const sb = b.seq ?? 0;
    return sa - sb;
  });

/**
 * Generate a safe unique ID
 */
export function safeId(): string {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/**
 * Get role suffix for group
 */
function roleSuffixForGroup(groupKey: string): string {
  if (groupKey === 'prelight') return 'P';
  if (groupKey === 'pickup') return 'R';
  return '';
}

/**
 * Get role title suffix for group
 */
function roleTitleSuffix(groupKey: string): string {
  if (groupKey === 'prelight') return ' Prelight';
  if (groupKey === 'pickup') return ' Recogida';
  return '';
}

/**
 * Display badge with group suffix
 */
export function displayBadge(roleCode: string, groupKey: string, language?: string): string {
  // Si el rol tiene prefijo "REF" (refuerzo), mostrar "REF" + badge del rol base
  if (roleCode.startsWith('REF') && roleCode.length > 3) {
    const baseCode = roleCode.substring(3);
    const baseBadge = getRoleBadgeCode(baseCode, language);
    return `REF${baseBadge}`;
  }
  const badgeCode = getRoleBadgeCode(roleCode, language);
  const suf = roleSuffixForGroup(groupKey);
  return suf ? `${badgeCode}${suf}` : badgeCode;
}

/**
 * Display roles for group with title suffix
 */
export function displayRolesForGroup(roles: AnyRecord[], groupKey: string): AnyRecord[] {
  const sufTitle = roleTitleSuffix(groupKey);
  if (!sufTitle) return roles;
  return roles.map(r => ({ ...r, label: `${r.label}${sufTitle}` }));
}

/**
 * Translate role label
 */
export function translateRoleLabel(
  roleCode: string,
  t: (key: string, options?: any) => string,
  groupKey?: string,
  gender: 'male' | 'female' | 'neutral' = 'neutral'
): string {
  const genderContext = gender === 'male' || gender === 'female' || gender === 'neutral' ? gender : 'neutral';
  // Si el rol tiene prefijo "REF" (refuerzo), traducir el rol base y añadir "Refuerzo" antes
  if (roleCode.startsWith('REF') && roleCode.length > 3) {
    const baseCode = roleCode.substring(3);
    const baseTranslationKey = `team.roles.${baseCode}`;
    const baseTranslated = t(baseTranslationKey, { context: genderContext });
    const baseLabel = baseTranslated !== baseTranslationKey ? baseTranslated : baseCode;
    // Añadir prefijo de refuerzo antes del nombre del rol base
    const refuerzoLabel = `${t('team.reinforcementPrefix')} ${baseLabel}`;
    // Añadir sufijo de grupo si es prelight o pickup
    const sufTitle = roleTitleSuffix(groupKey || '');
    return refuerzoLabel + sufTitle;
  }
  const translationKey = `team.roles.${roleCode}`;
  const translated = t(translationKey, { context: genderContext });
  const label = translated !== translationKey ? translated : '';
  // Añadir sufijo de grupo si es prelight o pickup
  const sufTitle = roleTitleSuffix(groupKey || '');
  return label + sufTitle;
}

/**
 * Normalize initial team data
 */
export function normalizeInitial(initialTeam: AnyRecord, currentUser: AnyRecord): AnyRecord {
  const blank = { base: [], reinforcements: [], prelight: [], pickup: [] } as AnyRecord;
  let model = { ...blank, ...(initialTeam || {}) } as AnyRecord;
  let seq = 0;
  ;['base', 'reinforcements', 'prelight', 'pickup'].forEach((k: string) => {
    model[k] = (model[k] || []).map((r: AnyRecord) => ({ ...r, seq: r.seq ?? seq++ }));
  });
  
  // Filtrar REF del equipo base, refuerzos, prelight y pickup - el rol 'REF' ya no se usa
  if (model.base && Array.isArray(model.base)) {
    model.base = model.base.filter((r: AnyRecord) => r.role !== 'REF');
  }
  // También eliminar cualquier rol 'REF' existente en refuerzos, prelight y pickup
  if (model.reinforcements && Array.isArray(model.reinforcements)) {
    model.reinforcements = model.reinforcements.filter((r: AnyRecord) => r.role !== 'REF');
  }
  if (model.prelight && Array.isArray(model.prelight)) {
    model.prelight = model.prelight.filter((r: AnyRecord) => r.role !== 'REF');
  }
  if (model.pickup && Array.isArray(model.pickup)) {
    model.pickup = model.pickup.filter((r: AnyRecord) => r.role !== 'REF');
  }
  
  const isBoss = currentUser?.role === 'G' || currentUser?.role === 'BB';
  if ((!model.base || model.base.length === 0) && isBoss && currentUser?.name) {
    model.base = [
      { id: safeId(), role: currentUser.role, name: currentUser.name, seq: seq++ },
    ];
  }
  model.base = sortTeam(model.base || []);
  model.reinforcements = sortTeam(model.reinforcements || []);
  model.prelight = sortTeam(model.prelight || []);
  model.pickup = sortTeam(model.pickup || []);
  return model;
}

