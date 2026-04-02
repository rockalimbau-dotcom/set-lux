import {
  ROLE_CODE_TO_LABEL,
  ROLE_COLORS,
  ROLE_ORDER,
  ROLES,
  hasRoleGroupSuffix,
  stripRefuerzoSuffix,
  stripRoleSuffix,
} from '@shared/constants/roles';

export type ProjectRoleId = string;

export interface ProjectRoleDefinition {
  id: ProjectRoleId;
  label: string;
  legacyCode?: string;
  baseRole?: string;
  color?: {
    bg: string;
    fg: string;
  };
  badge?: string;
  sortOrder: number;
  active: boolean;
  supportsPrelight: boolean;
  supportsPickup: boolean;
  supportsRefuerzo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRoleCatalog {
  version: 1;
  roles: ProjectRoleDefinition[];
}

export interface ProjectRoleInput {
  roleId?: string | null;
  role?: string | null;
}

export interface ProjectRoleMember extends ProjectRoleInput {
  name?: string | null;
  [key: string]: any;
}

export interface ResolvedProjectRole {
  id: ProjectRoleId | null;
  roleId: ProjectRoleId | null;
  label: string;
  legacyCode?: string;
  baseRole?: string;
  color: ProjectRoleDefinition['color'] | null;
  sortOrder: number;
  active: boolean;
  source: 'roleId' | 'legacyRole' | 'fallback';
  definition: ProjectRoleDefinition | null;
}

type ProjectLike = {
  roleCatalog?: ProjectRoleCatalog | null;
  [key: string]: any;
};

const ROLE_LABEL_BY_CODE = new Map(
  ROLES.map(role => [role.code, role.label])
);

const nowISO = (): string => new Date().toISOString();

const sanitizeRoleIdPart = (value: string): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export function buildProjectRoleId(baseCode: string, suffix = 'default'): ProjectRoleId {
  const base = sanitizeRoleIdPart(baseCode || 'role');
  const tail = sanitizeRoleIdPart(suffix || 'default');
  return tail ? `${base}_${tail}` : base;
}

export function normalizeLegacyRoleCode(role: unknown): string {
  let raw = String(role || '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'REF') return 'REF';
  if (raw.startsWith('REF') && raw.length > 3) {
    raw = stripRefuerzoSuffix(raw).substring(3);
  }
  if (hasRoleGroupSuffix(raw)) {
    raw = stripRoleSuffix(raw);
  }
  if (raw === 'RIG') return 'RE';
  return raw;
}

export function buildDefaultProjectRoleCatalog(referenceDate = nowISO()): ProjectRoleCatalog {
  const roles = ROLE_ORDER.map((code, index) => {
    const normalizedCode = code === 'RIG' ? 'RE' : code;
    const label =
      ROLE_LABEL_BY_CODE.get(code) ||
      ROLE_CODE_TO_LABEL[code as keyof typeof ROLE_CODE_TO_LABEL] ||
      normalizedCode;
    const color =
      ROLE_COLORS[code as keyof typeof ROLE_COLORS] ||
      ROLE_COLORS[normalizedCode as keyof typeof ROLE_COLORS];

    return {
      id: buildProjectRoleId(normalizedCode),
      label,
      legacyCode: normalizedCode,
      baseRole: normalizedCode,
      color,
      sortOrder: index,
      active: true,
      supportsPrelight: normalizedCode !== 'REF',
      supportsPickup: normalizedCode !== 'REF',
      supportsRefuerzo: normalizedCode !== 'REF',
      createdAt: referenceDate,
      updatedAt: referenceDate,
    } satisfies ProjectRoleDefinition;
  }).filter((role, index, list) => list.findIndex(item => item.id === role.id) === index);

  return {
    version: 1,
    roles,
  };
}

export function normalizeProjectRoleCatalog(project: ProjectLike | null | undefined): ProjectRoleCatalog {
  const existing = project?.roleCatalog;
  const fallback = buildDefaultProjectRoleCatalog();

  if (!existing || !Array.isArray(existing.roles) || existing.roles.length === 0) {
    return fallback;
  }

  const merged = new Map<string, ProjectRoleDefinition>();

  for (const defaultRole of fallback.roles) {
    merged.set(defaultRole.id, defaultRole);
  }

  for (const role of existing.roles) {
    if (!role) continue;
    const id = String(role.id || '').trim() || buildProjectRoleId(String(role.legacyCode || role.baseRole || role.label || 'role'));
    const normalized: ProjectRoleDefinition = {
      ...merged.get(id),
      ...role,
      id,
      label: String(role.label || merged.get(id)?.label || role.legacyCode || 'Rol'),
      legacyCode: role.legacyCode ? String(role.legacyCode).toUpperCase() : merged.get(id)?.legacyCode,
      baseRole: role.baseRole ? String(role.baseRole).toUpperCase() : merged.get(id)?.baseRole,
      color: role.color || merged.get(id)?.color,
      sortOrder: Number.isFinite(role.sortOrder) ? Number(role.sortOrder) : (merged.get(id)?.sortOrder ?? 999),
      active: role.active !== false,
      supportsPrelight: role.supportsPrelight ?? merged.get(id)?.supportsPrelight ?? true,
      supportsPickup: role.supportsPickup ?? merged.get(id)?.supportsPickup ?? true,
      supportsRefuerzo: role.supportsRefuerzo ?? merged.get(id)?.supportsRefuerzo ?? true,
      createdAt: role.createdAt || merged.get(id)?.createdAt || fallback.roles[0]?.createdAt,
      updatedAt: role.updatedAt || merged.get(id)?.updatedAt || fallback.roles[0]?.updatedAt,
    };
    merged.set(id, normalized);
  }

  return {
    version: 1,
    roles: Array.from(merged.values()).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'es')),
  };
}

export function normalizeProjectWithRoleCatalog<T extends ProjectLike>(project: T): T & { roleCatalog: ProjectRoleCatalog } {
  return {
    ...project,
    roleCatalog: normalizeProjectRoleCatalog(project),
  };
}

export function findProjectRoleById(
  catalog: ProjectRoleCatalog | null | undefined,
  roleId: string | null | undefined
): ProjectRoleDefinition | null {
  if (!catalog?.roles || !roleId) return null;
  return catalog.roles.find(role => role.id === roleId) || null;
}

export function findProjectRoleByLegacyCode(
  catalog: ProjectRoleCatalog | null | undefined,
  legacyRole: string | null | undefined
): ProjectRoleDefinition | null {
  if (!catalog?.roles || !legacyRole) return null;
  const normalizedCode = normalizeLegacyRoleCode(legacyRole);
  if (!normalizedCode) return null;
  const defaultRoleId = buildProjectRoleId(normalizedCode);
  return (
    catalog.roles.find(role => role.id === defaultRoleId) ||
    catalog.roles.find(role => String(role.legacyCode || '').toUpperCase() === normalizedCode) ||
    catalog.roles.find(role => String(role.baseRole || '').toUpperCase() === normalizedCode) ||
    null
  );
}

export function resolveProjectRole(
  project: ProjectLike | null | undefined,
  input: ProjectRoleInput
): ProjectRoleDefinition | null {
  const catalog = normalizeProjectRoleCatalog(project);
  return (
    findProjectRoleById(catalog, input.roleId) ||
    findProjectRoleByLegacyCode(catalog, input.role) ||
    null
  );
}

export function resolveMemberProjectRole(
  project: ProjectLike | null | undefined,
  member: ProjectRoleMember | null | undefined
): ResolvedProjectRole {
  const catalog = normalizeProjectRoleCatalog(project);
  const normalizedMemberLabel = String(member?.roleLabel || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
  const byId = findProjectRoleById(catalog, member?.roleId);
  if (byId) {
    return {
      id: byId.id,
      roleId: byId.id,
      label: byId.label,
      legacyCode: byId.legacyCode,
      baseRole: byId.baseRole,
      color: byId.color || null,
      sortOrder: byId.sortOrder,
      active: byId.active !== false,
      source: 'roleId',
      definition: byId,
    };
  }

  const byLabel =
    normalizedMemberLabel
      ? catalog.roles.find(role =>
          String(role.label || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, ' ') === normalizedMemberLabel
        ) || null
      : null;
  if (byLabel) {
    return {
      id: byLabel.id,
      roleId: byLabel.id,
      label: byLabel.label,
      legacyCode: byLabel.legacyCode,
      baseRole: byLabel.baseRole,
      color: byLabel.color || null,
      sortOrder: byLabel.sortOrder,
      active: byLabel.active !== false,
      source: 'legacyRole',
      definition: byLabel,
    };
  }

  const byLegacy = findProjectRoleByLegacyCode(catalog, member?.role);
  if (byLegacy) {
    return {
      id: byLegacy.id,
      roleId: byLegacy.id,
      label: byLegacy.label,
      legacyCode: byLegacy.legacyCode,
      baseRole: byLegacy.baseRole,
      color: byLegacy.color || null,
      sortOrder: byLegacy.sortOrder,
      active: byLegacy.active !== false,
      source: 'legacyRole',
      definition: byLegacy,
    };
  }

  const fallbackLabel = String(member?.role || '').trim() || 'Sin rol';
  return {
    id: null,
    roleId: null,
    label: fallbackLabel,
    legacyCode: normalizeLegacyRoleCode(member?.role) || undefined,
    baseRole: normalizeLegacyRoleCode(member?.role) || undefined,
    color: null,
    sortOrder: 999,
    active: true,
    source: 'fallback',
    definition: null,
  };
}

export function getMemberRoleLabel(
  project: ProjectLike | null | undefined,
  member: ProjectRoleMember | null | undefined
): string {
  return resolveMemberProjectRole(project, member).label;
}

export function getMemberRoleColor(
  project: ProjectLike | null | undefined,
  member: ProjectRoleMember | null | undefined
) {
  return resolveMemberProjectRole(project, member).color;
}

export function getMemberRoleSortOrder(
  project: ProjectLike | null | undefined,
  member: ProjectRoleMember | null | undefined
): number {
  return resolveMemberProjectRole(project, member).sortOrder;
}

export function assignProjectRoleToMember<T extends ProjectRoleMember>(
  project: ProjectLike | null | undefined,
  member: T,
  roleId: string | null | undefined
): T {
  const catalog = normalizeProjectRoleCatalog(project);
  const matched = findProjectRoleById(catalog, roleId);
  if (!matched) {
    return {
      ...member,
      roleId: roleId || undefined,
    };
  }

  return {
    ...member,
    roleId: matched.id,
    role: matched.legacyCode || member.role,
  };
}

export function getProjectRoleLabel(
  project: ProjectLike | null | undefined,
  input: ProjectRoleInput
): string {
  const resolved = resolveProjectRole(project, input);
  return resolved?.label || String(input.role || '').trim();
}

export function getProjectRoleSortOrder(
  project: ProjectLike | null | undefined,
  input: ProjectRoleInput
): number {
  const resolved = resolveProjectRole(project, input);
  return resolved?.sortOrder ?? 999;
}

export function getProjectRoleColor(
  project: ProjectLike | null | undefined,
  input: ProjectRoleInput
) {
  const resolved = resolveProjectRole(project, input);
  return resolved?.color || null;
}

export function buildUniqueProjectRoleId(
  catalog: ProjectRoleCatalog | null | undefined,
  baseCode: string,
  suffix: string
): ProjectRoleId {
  const existingIds = new Set((catalog?.roles || []).map(role => String(role.id || '').trim()));
  const baseId = buildProjectRoleId(baseCode, suffix || 'custom');
  if (!existingIds.has(baseId)) return baseId;

  let index = 2;
  let candidate = `${baseId}_${index}`;
  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `${baseId}_${index}`;
  }
  return candidate;
}

export function createProjectRole(
  project: ProjectLike | null | undefined,
  input: {
    label: string;
    basedOnRoleId?: string | null;
    basedOnRole?: string | null;
  }
): ProjectRoleCatalog {
  const catalog = normalizeProjectRoleCatalog(project);
  const baseRole =
    resolveProjectRole(project, {
      roleId: input.basedOnRoleId || undefined,
      role: input.basedOnRole || undefined,
    }) || catalog.roles[0];

  const safeLabel = String(input.label || '').trim() || 'Nuevo rol';
  const nextRole: ProjectRoleDefinition = {
    id: buildUniqueProjectRoleId(catalog, baseRole?.baseRole || baseRole?.legacyCode || 'role', safeLabel),
    label: safeLabel,
    legacyCode: baseRole?.legacyCode,
    baseRole: baseRole?.baseRole || baseRole?.legacyCode,
    color: baseRole?.color,
    badge: baseRole?.badge,
    sortOrder: Number.isFinite(baseRole?.sortOrder) ? Number(baseRole.sortOrder) : 999,
    active: true,
    supportsPrelight: baseRole?.supportsPrelight ?? true,
    supportsPickup: baseRole?.supportsPickup ?? true,
    supportsRefuerzo: baseRole?.supportsRefuerzo ?? true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  return {
    version: 1,
    roles: [...catalog.roles, nextRole].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'es')),
  };
}

export function renameProjectRole(
  project: ProjectLike | null | undefined,
  roleId: string,
  nextLabel: string
): ProjectRoleCatalog {
  const catalog = normalizeProjectRoleCatalog(project);
  const safeLabel = String(nextLabel || '').trim();
  if (!safeLabel) return catalog;

  return {
    version: 1,
    roles: catalog.roles.map(role =>
      role.id === roleId
        ? {
            ...role,
            label: safeLabel,
            updatedAt: nowISO(),
          }
        : role
    ),
  };
}

export function archiveProjectRole(
  project: ProjectLike | null | undefined,
  roleId: string
): ProjectRoleCatalog {
  const catalog = normalizeProjectRoleCatalog(project);
  const roleToArchive = findProjectRoleById(catalog, roleId);
  if (!roleToArchive) return catalog;

  return {
    version: 1,
    roles: catalog.roles.map(role =>
      role.id === roleId
        ? {
            ...role,
            active: false,
            updatedAt: nowISO(),
          }
        : role
    ),
  };
}
