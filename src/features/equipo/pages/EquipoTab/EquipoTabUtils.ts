import { AnyRecord } from '@shared/types/common';
import { roleRank } from '@shared/constants/roles';

/**
 * Sort team by role rank and sequence
 */
export const sortTeam = (arr: AnyRecord[]): AnyRecord[] =>
  [...arr].sort((a, b) => {
    const ra = roleRank(a.role);
    const rb = roleRank(b.role);
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
export function roleSuffixForGroup(groupKey: string): string {
  if (groupKey === 'prelight') return 'P';
  if (groupKey === 'pickup') return 'R';
  return '';
}

/**
 * Get role title suffix for group
 */
export function roleTitleSuffix(groupKey: string): string {
  if (groupKey === 'prelight') return ' Prelight';
  if (groupKey === 'pickup') return ' Recogida';
  return '';
}

/**
 * Display badge with group suffix
 */
export function displayBadge(roleCode: string, groupKey: string): string {
  const suf = roleSuffixForGroup(groupKey);
  return suf ? `${roleCode}${suf}` : roleCode;
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
export function translateRoleLabel(roleCode: string, t: (key: string) => string): string {
  const translationKey = `team.roles.${roleCode}`;
  const translated = t(translationKey);
  return translated !== translationKey ? translated : '';
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

