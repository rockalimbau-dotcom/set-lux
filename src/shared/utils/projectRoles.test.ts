import { describe, expect, it } from 'vitest';

import {
  archiveProjectRole,
  assignProjectRoleToMember,
  buildDefaultProjectRoleCatalog,
  createProjectRole,
  findProjectRoleByLegacyCode,
  getMemberRoleColor,
  getMemberRoleLabel,
  getMemberRoleSortOrder,
  getProjectRoleLabel,
  normalizeLegacyRoleCode,
  normalizeProjectRoleCatalog,
  normalizeProjectWithRoleCatalog,
  renameProjectRole,
  resolveMemberProjectRole,
} from './projectRoles';

describe('projectRoles', () => {
  it('builds a default catalog from current legacy roles', () => {
    const catalog = buildDefaultProjectRoleCatalog('2026-01-01T00:00:00.000Z');

    expect(catalog.version).toBe(1);
    expect(catalog.roles.length).toBeGreaterThan(10);
    expect(catalog.roles.some(role => role.legacyCode === 'E')).toBe(true);
    expect(catalog.roles.some(role => role.legacyCode === 'G')).toBe(true);
  });

  it('normalizes legacy role codes with suffixes and refuerzo prefixes', () => {
    expect(normalizeLegacyRoleCode('EP')).toBe('E');
    expect(normalizeLegacyRoleCode('ER')).toBe('E');
    expect(normalizeLegacyRoleCode('REFE')).toBe('E');
    expect(normalizeLegacyRoleCode('REF')).toBe('REF');
    expect(normalizeLegacyRoleCode('RIG')).toBe('RE');
  });

  it('creates a role catalog automatically for legacy projects', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
      country: 'ES',
      region: 'CT',
    });

    expect(project.roleCatalog).toBeDefined();
    expect(project.roleCatalog.roles.length).toBeGreaterThan(0);
  });

  it('merges custom role catalogs with defaults', () => {
    const catalog = normalizeProjectRoleCatalog({
      roleCatalog: {
        version: 1,
        roles: [
          {
            id: 'electric_premium',
            label: 'Electrico premium',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 25,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    });

    expect(catalog.roles.some(role => role.id === 'electric_premium')).toBe(true);
    expect(catalog.roles.some(role => role.legacyCode === 'G')).toBe(true);
  });

  it('resolves labels using legacy role codes while the app is still in compatibility mode', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
    });

    const electricRole = findProjectRoleByLegacyCode(project.roleCatalog, 'EP');
    expect(electricRole?.legacyCode).toBe('E');
    expect(getProjectRoleLabel(project, { role: 'EP' })).not.toBe('');
  });

  it('prefers the default role for a legacy code when custom roles share the same base', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
      roleCatalog: {
        version: 1,
        roles: [
          {
            id: 'electric_factura',
            label: 'Eléctrico factura',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 20,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    });

    const electricRole = findProjectRoleByLegacyCode(project.roleCatalog, 'E');
    expect(electricRole?.id).toBe('e_default');
  });

  it('prefers roleId when resolving a member role', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
      roleCatalog: {
        version: 1,
        roles: [
          {
            id: 'electric_premium',
            label: 'Electrico premium',
            legacyCode: 'E',
            baseRole: 'E',
            color: { bg: '#000', fg: '#fff' },
            sortOrder: 25,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    });

    const resolved = resolveMemberProjectRole(project, {
      roleId: 'electric_premium',
      role: 'G',
      name: 'Ana',
    });

    expect(resolved.source).toBe('roleId');
    expect(resolved.roleId).toBe('electric_premium');
    expect(resolved.label).toBe('Electrico premium');
    expect(getMemberRoleColor(project, { roleId: 'electric_premium' })).toEqual({ bg: '#000', fg: '#fff' });
    expect(getMemberRoleSortOrder(project, { roleId: 'electric_premium' })).toBe(25);
  });

  it('resolves members from legacy role codes when roleId is missing', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
    });

    const resolved = resolveMemberProjectRole(project, { role: 'EP', name: 'Luis' });

    expect(resolved.source).toBe('legacyRole');
    expect(resolved.legacyCode).toBe('E');
    expect(getMemberRoleLabel(project, { role: 'EP' })).not.toBe('');
  });

  it('prefers a matching custom roleLabel before falling back to the base legacy role', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
      roleCatalog: {
        version: 1,
        roles: [
          {
            id: 'electric_factura',
            label: 'Eléctrico factura',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 20,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    });

    const resolved = resolveMemberProjectRole(project, {
      role: 'E',
      roleLabel: 'Eléctrico factura',
      name: 'Pol Peitx',
    });

    expect(resolved.roleId).toBe('electric_factura');
    expect(resolved.label).toBe('Eléctrico factura');
  });

  it('falls back safely for unknown member roles', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
    });

    const resolved = resolveMemberProjectRole(project, { role: 'FOO', name: 'Alex' });

    expect(resolved.source).toBe('fallback');
    expect(resolved.roleId).toBeNull();
    expect(resolved.label).toBe('FOO');
    expect(getMemberRoleSortOrder(project, { role: 'FOO' })).toBe(999);
  });

  it('assigns a catalog role to a member while preserving legacy compatibility', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
      roleCatalog: {
        version: 1,
        roles: [
          {
            id: 'electric_premium',
            label: 'Electrico premium',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 25,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    });

    const assigned = assignProjectRoleToMember(project, { name: 'Nora' }, 'electric_premium');

    expect(assigned.roleId).toBe('electric_premium');
    expect(assigned.role).toBe('E');
  });

  it('creates a custom role from an existing base role', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
    });

    const nextCatalog = createProjectRole(project, {
      label: 'Eléctrico noche',
      basedOnRole: 'E',
    });

    const created = nextCatalog.roles.find(role => role.label === 'Eléctrico noche');
    expect(created).toBeTruthy();
    expect(created?.legacyCode).toBe('E');
    expect(created?.baseRole).toBe('E');
    expect(created?.active).toBe(true);
    const baseElectric = project.roleCatalog.roles.find(role => role.legacyCode === 'E');
    expect(created?.sortOrder).toBe(baseElectric?.sortOrder);
  });

  it('renames an existing catalog role', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
    });
    const roleId = project.roleCatalog.roles.find(role => role.legacyCode === 'E')?.id as string;

    const nextCatalog = renameProjectRole(project, roleId, 'Eléctrico rodaje');

    expect(nextCatalog.roles.find(role => role.id === roleId)?.label).toBe('Eléctrico rodaje');
  });

  it('archives a role without deleting it from the catalog', () => {
    const project = normalizeProjectWithRoleCatalog({
      id: 'p1',
      nombre: 'Demo',
    });
    const withCustom = createProjectRole(project, {
      label: 'Eléctrico noche',
      basedOnRole: 'E',
    });
    const customRoleId = withCustom.roles.find(role => role.label === 'Eléctrico noche')?.id as string;

    const archived = archiveProjectRole({ roleCatalog: withCustom }, customRoleId);

    expect(archived.roles.find(role => role.id === customRoleId)?.active).toBe(false);
  });
});
