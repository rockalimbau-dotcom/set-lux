import { AnyRecord } from '@shared/types/common';
import { buildProjectRoleId, findProjectRoleById, findProjectRoleByLegacyCode, getProjectRoleSortOrder, normalizeLegacyRoleCode, normalizeProjectRoleCatalog } from '@shared/utils/projectRoles';

export type ConditionSectionKey = 'base' | 'prelight' | 'pickup';

export interface ConditionRoleOption {
  key: string;
  label: string;
  sortOrder: number;
  legacyCode?: string;
}

export const LEGACY_CONDITION_ROLE_TO_CODE: Record<string, string> = {
  'Gaffer': 'G',
  'Best boy': 'BB',
  'Rigging Gaffer': 'RG',
  'Rigging Best Boy': 'RBB',
  'Rigging Eléctrico': 'RE',
  'Eléctrico': 'E',
  'Eléctrico/a': 'E',
  'Auxiliar': 'AUX',
  'Meritorio': 'M',
  'Técnico de mesa': 'TM',
  'Finger boy': 'FB',
  'Técnico de Generador': 'TG',
  'Grupista eléctrico': 'TG',
  'Chofer eléctrico': 'CE',
  'Eléctrico de potencia': 'EPO',
  'Técnico de prácticos': 'TP',
  'Refuerzo': 'REF',
  'Rigger': 'RIG',
};

const roleSuffixForSection = (sectionKey?: ConditionSectionKey): string => {
  if (sectionKey === 'prelight') return ' Prelight';
  if (sectionKey === 'pickup') return ' Recogida';
  return '';
};

function findDefaultConditionRoleByLegacyCode(
  project: AnyRecord | null | undefined,
  legacyRole: string | null | undefined
) {
  const catalog = normalizeProjectRoleCatalog(project);
  const normalizedCode = normalizeLegacyRoleCode(legacyRole);
  if (!normalizedCode) return null;

  const defaultRoleId = buildProjectRoleId(normalizedCode);
  return (
    findProjectRoleById(catalog, defaultRoleId) ||
    findProjectRoleByLegacyCode(catalog, normalizedCode)
  );
}

export function normalizeConditionRoleKey(project: AnyRecord | null | undefined, roleKey: string): string {
  const raw = String(roleKey || '').trim();
  if (!raw) return raw;

  const catalog = normalizeProjectRoleCatalog(project);
  const byId = findProjectRoleById(catalog, raw);
  if (byId) return byId.id;

  const mappedCode = LEGACY_CONDITION_ROLE_TO_CODE[raw];
  const byCode = mappedCode ? findDefaultConditionRoleByLegacyCode(project, mappedCode) : null;
  if (byCode) return byCode.id;

  const byLabel = catalog.roles.find(role => String(role.label || '').trim() === raw);
  if (byLabel) return byLabel.id;

  return raw;
}

export function getDefaultConditionRoleKeys(project: AnyRecord | null | undefined): string[] {
  const gaffer = findDefaultConditionRoleByLegacyCode(project, 'G');
  const electric = findDefaultConditionRoleByLegacyCode(project, 'E');

  const keys = [gaffer?.id || 'Gaffer', electric?.id || 'Eléctrico'];
  return Array.from(new Set(keys.filter(Boolean)));
}

export function getConditionRoleLabel(
  project: AnyRecord | null | undefined,
  roleKey: string,
  sectionKey?: ConditionSectionKey
): string {
  const normalizedKey = normalizeConditionRoleKey(project, roleKey);
  const catalog = normalizeProjectRoleCatalog(project);
  const byId = findProjectRoleById(catalog, normalizedKey);
  const byCode = LEGACY_CONDITION_ROLE_TO_CODE[roleKey]
    ? findDefaultConditionRoleByLegacyCode(project, LEGACY_CONDITION_ROLE_TO_CODE[roleKey])
    : null;
  const baseLabel = byId?.label || byCode?.label || String(roleKey || '').trim();
  return `${baseLabel}${roleSuffixForSection(sectionKey)}`;
}

export function getConditionRoleOptions(project: AnyRecord | null | undefined): ConditionRoleOption[] {
  const catalog = normalizeProjectRoleCatalog(project);
  return catalog.roles
    .filter(role => role.active !== false)
    .filter(role => String(role.legacyCode || role.baseRole || '').toUpperCase() !== 'REF')
    .map(role => ({
      key: role.id,
      label: role.label,
      sortOrder: role.sortOrder,
      legacyCode: role.legacyCode,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'es'));
}

export function sortConditionRoleKeys(
  project: AnyRecord | null | undefined,
  roleKeys: string[],
  fallbackOrder: string[] = []
): string[] {
  return Array.from(new Set((roleKeys || []).filter(Boolean))).sort((a, b) => {
    const aOrder = getProjectRoleSortOrder(project, { roleId: a, role: LEGACY_CONDITION_ROLE_TO_CODE[a] || a });
    const bOrder = getProjectRoleSortOrder(project, { roleId: b, role: LEGACY_CONDITION_ROLE_TO_CODE[b] || b });

    if (aOrder !== 999 || bOrder !== 999) {
      if (aOrder !== bOrder) return aOrder - bOrder;
    }

    const fallbackA = fallbackOrder.indexOf(a);
    const fallbackB = fallbackOrder.indexOf(b);
    if (fallbackA !== fallbackB) {
      if (fallbackA === -1) return 1;
      if (fallbackB === -1) return -1;
      return fallbackA - fallbackB;
    }

    return getConditionRoleLabel(project, a).localeCompare(getConditionRoleLabel(project, b), 'es');
  });
}

export function normalizeConditionPricesMap(
  project: AnyRecord | null | undefined,
  prices: AnyRecord | undefined
): AnyRecord {
  if (!prices || typeof prices !== 'object') return {};
  const next: AnyRecord = {};
  for (const [roleKey, value] of Object.entries(prices)) {
    const normalizedKey = normalizeConditionRoleKey(project, roleKey);
    next[normalizedKey] = {
      ...(next[normalizedKey] || {}),
      ...(value as AnyRecord),
    };
  }
  return next;
}

export function normalizeConditionModel(
  project: AnyRecord | null | undefined,
  model: AnyRecord | undefined,
  fallbackOrder: string[] = [],
  preserveExtraPriceKeys = false
): AnyRecord {
  const safeModel = { ...(model || {}) };
  const defaultRoles = getDefaultConditionRoleKeys(project);
  const prices = normalizeConditionPricesMap(project, safeModel.prices);
  const pricesPrelight = normalizeConditionPricesMap(project, safeModel.pricesPrelight);
  const pricesPickup = normalizeConditionPricesMap(project, safeModel.pricesPickup);

  const incomingRoles = Array.isArray(safeModel.roles) && safeModel.roles.length > 0
    ? safeModel.roles
    : defaultRoles;

  const normalizedRoles = sortConditionRoleKeys(
    project,
    incomingRoles.map((role: string) => normalizeConditionRoleKey(project, role)),
    fallbackOrder
  );

  const finalPrices = { ...prices };
  for (const role of normalizedRoles) {
    if (!finalPrices[role]) {
      finalPrices[role] = {};
    }
  }
  for (const role of defaultRoles) {
    if (!finalPrices[role]) {
      finalPrices[role] = {};
    }
  }

  return {
    ...safeModel,
    roles: normalizedRoles,
    prices: finalPrices,
    pricesPrelight: preserveExtraPriceKeys || safeModel.pricesPrelight !== undefined ? pricesPrelight : safeModel.pricesPrelight,
    pricesPickup: preserveExtraPriceKeys || safeModel.pricesPickup !== undefined ? pricesPickup : safeModel.pricesPickup,
  };
}
