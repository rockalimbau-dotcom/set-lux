import { AnyRecord } from '@shared/types/common';
import { roleRank, getRoleBadgeCode } from '@shared/constants/roles';
import {
  assignProjectRoleToMember,
  buildProjectRoleId,
  getMemberRoleLabel,
  getMemberRoleSortOrder,
  getProjectRoleColor,
  normalizeLegacyRoleCode,
  normalizeProjectRoleCatalog,
  resolveMemberProjectRole,
} from '@shared/utils/projectRoles';
import { TeamRoleOption } from './EquipoTabTypes';

const normalizeRoleValue = (role: unknown): string => (String(role || '').toUpperCase() === 'RIG' ? 'RE' : String(role || ''));

const rolePrefixForGroup = (groupKey: string): string => {
  if (groupKey === 'reinforcements') return 'REF';
  return '';
};

export function buildAllowedRoles(
  project: AnyRecord | undefined,
  projectMode: 'semanal' | 'mensual' | 'diario',
  groupKey: string
): TeamRoleOption[] {
  const catalog = normalizeProjectRoleCatalog(project);
  const prefix = rolePrefixForGroup(groupKey);

  return catalog.roles
    .filter(role => role.active !== false)
    .filter(role => projectMode !== 'diario' || !['M', 'REF'].includes(String(role.legacyCode || role.baseRole || '').toUpperCase()))
    .filter(role => groupKey !== 'reinforcements' || !['AUX', 'M', 'REF'].includes(String(role.legacyCode || role.baseRole || '').toUpperCase()))
    .filter(role => groupKey === 'reinforcements' || String(role.legacyCode || role.baseRole || '').toUpperCase() !== 'REF')
    .map(role => {
      const legacyCode = normalizeRoleValue(role.legacyCode || role.baseRole || role.id).toUpperCase();
      return {
        code: `${prefix}${legacyCode}`,
        label: role.label,
        roleId: role.id,
        legacyCode,
        color: role.color || getProjectRoleColor(project, { roleId: role.id }),
      } satisfies TeamRoleOption;
    })
    .sort((a, b) => {
      const orderA = getMemberRoleSortOrder(project, { roleId: a.roleId, role: a.code });
      const orderB = getMemberRoleSortOrder(project, { roleId: b.roleId, role: b.code });
      return orderA - orderB || a.label.localeCompare(b.label, 'es');
    });
}

/**
 * Sort team by role rank and sequence
 */
export const sortTeam = (arr: AnyRecord[], project?: AnyRecord): AnyRecord[] =>
  [...arr].sort((a, b) => {
    const catalogRankA = getMemberRoleSortOrder(project, a);
    const catalogRankB = getMemberRoleSortOrder(project, b);
    if (catalogRankA !== catalogRankB) return catalogRankA - catalogRankB;

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

export function ensurePersonId(item: AnyRecord): string {
  const existing = String(item?.personId || '').trim();
  return existing || safeId();
}

const normalizePersonNameKey = (value: unknown): string =>
  String(value || '').trim().toLowerCase();

export function harmonizeTeamPersonIds(model: AnyRecord): AnyRecord {
  const nextModel = {
    base: Array.isArray(model?.base) ? [...model.base] : [],
    reinforcements: Array.isArray(model?.reinforcements) ? [...model.reinforcements] : [],
    prelight: Array.isArray(model?.prelight) ? [...model.prelight] : [],
    pickup: Array.isArray(model?.pickup) ? [...model.pickup] : [],
    enabledGroups: {
      prelight: model?.enabledGroups?.prelight ?? false,
      pickup: model?.enabledGroups?.pickup ?? false,
    },
  };

  const sharedIds = new Map<string, string>();
  (['base', 'reinforcements', 'prelight', 'pickup'] as const).forEach(groupKey => {
    nextModel[groupKey] = (nextModel[groupKey] || []).map((item: AnyRecord) => {
      const nameKey = normalizePersonNameKey(item?.name);
      if (!nameKey) {
        return { ...item, personId: ensurePersonId(item) };
      }

      const existingSharedId = sharedIds.get(nameKey);
      const finalPersonId = existingSharedId || ensurePersonId(item);
      if (!existingSharedId) {
        sharedIds.set(nameKey, finalPersonId);
      }

      return {
        ...item,
        personId: finalPersonId,
      };
    });
  });

  return nextModel;
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
  gender: 'male' | 'female' | 'neutral' = 'neutral',
  preferredLabel?: string
): string {
  const genderContext = gender === 'male' || gender === 'female' || gender === 'neutral' ? gender : 'neutral';
  // Si el rol tiene prefijo "REF" (refuerzo), traducir el rol base y añadir "Refuerzo" antes
  if (roleCode.startsWith('REF') && roleCode.length > 3) {
    const baseCode = roleCode.substring(3);
    const baseTranslationKey = `team.roles.${baseCode}`;
    const baseTranslated = t(baseTranslationKey, { context: genderContext });
    const baseLabel = baseTranslated !== baseTranslationKey ? baseTranslated : (preferredLabel || baseCode);
    // Añadir prefijo de refuerzo antes del nombre del rol base
    const refuerzoLabel = `${t('team.reinforcementPrefix')} ${baseLabel}`;
    // Añadir sufijo de grupo si es prelight o pickup
    const sufTitle = roleTitleSuffix(groupKey || '');
    return refuerzoLabel + sufTitle;
  }
  const translationKey = `team.roles.${roleCode}`;
  const translated = t(translationKey, { context: genderContext });
  const label = translated !== translationKey ? translated : (preferredLabel || '');
  // Añadir sufijo de grupo si es prelight o pickup
  const sufTitle = roleTitleSuffix(groupKey || '');
  return label + sufTitle;
}

export function getDisplayRoleLabel(
  project: AnyRecord | undefined,
  member: AnyRecord,
  t: (key: string, options?: any) => string,
  groupKey?: string,
  gender: 'male' | 'female' | 'neutral' = 'neutral'
): string {
  const resolved = resolveMemberProjectRole(project, member);
  const resolvedLabel = resolved.label || getMemberRoleLabel(project, member);
  const sufTitle = roleTitleSuffix(groupKey || '');

  if (member?.roleId) {
    const baseCode = String(resolved.definition?.baseRole || resolved.definition?.legacyCode || member?.role || '');
    const defaultRoleId = buildProjectRoleId(baseCode);
    const shouldUseGenderedBaseLabel =
      resolved.roleId === defaultRoleId ||
      resolvedLabel.includes('/') ||
      resolvedLabel === resolved.definition?.legacyCode ||
      resolvedLabel === resolved.definition?.baseRole;

    if (shouldUseGenderedBaseLabel && baseCode) {
      return translateRoleLabel(member?.role || baseCode, t, groupKey, gender, resolvedLabel) || resolvedLabel;
    }

    if (String(member?.role || '').startsWith('REF') && String(member?.role || '').length > 3) {
      return `${t('team.reinforcementPrefix')} ${resolvedLabel}${sufTitle}`;
    }
    return `${resolvedLabel}${sufTitle}`;
  }

  return translateRoleLabel(member?.role || '', t, groupKey, gender, resolvedLabel) || resolvedLabel;
}

export function normalizeTeamMember(project: AnyRecord | undefined, item: AnyRecord): AnyRecord {
  if (!item) return item;
  const normalizedRole = item?.role ? normalizeRoleValue(item.role) : item?.role;
  const normalizedItem = normalizedRole === item?.role ? { ...item } : { ...item, role: normalizedRole };
  const withPersonId = normalizedItem?.personId ? normalizedItem : { ...normalizedItem, personId: ensurePersonId(normalizedItem) };

  if (withPersonId?.roleId) {
    return withPersonId;
  }

  const resolved = resolveMemberProjectRole(project, withPersonId);
  const assigned = assignProjectRoleToMember(
    project,
    withPersonId,
    resolved.source === 'fallback' ? undefined : resolved.roleId
  );
  return assigned;
}

export function getTeamRowColor(project: AnyRecord | undefined, row: AnyRecord) {
  const resolved = resolveMemberProjectRole(project, row);
  return resolved.color || getProjectRoleColor(project, { roleId: row?.roleId, role: row?.role }) || null;
}

/**
 * Normalize initial team data
 */
export function normalizeInitial(initialTeam: AnyRecord, currentUser: AnyRecord, project?: AnyRecord): AnyRecord {
  const blank = { base: [], reinforcements: [], prelight: [], pickup: [] } as AnyRecord;
  let model = { ...blank, ...(initialTeam || {}) } as AnyRecord;
  let seq = 0;
  ;['base', 'reinforcements', 'prelight', 'pickup'].forEach((k: string) => {
    model[k] = (model[k] || []).map((r: AnyRecord) => normalizeTeamMember(project, { ...r, seq: r.seq ?? seq++ }));
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
      normalizeTeamMember(project, { id: safeId(), personId: safeId(), role: currentUser.role, name: currentUser.name, seq: seq++ }),
    ];
  }
  model.base = sortTeam(model.base || [], project);
  model.reinforcements = sortTeam(model.reinforcements || [], project);
  model.prelight = sortTeam(model.prelight || [], project);
  model.pickup = sortTeam(model.pickup || [], project);
  return harmonizeTeamPersonIds(model);
}
