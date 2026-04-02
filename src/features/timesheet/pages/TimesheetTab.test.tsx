import { describe, expect, it, vi } from 'vitest';

vi.mock('jspdf', () => ({
  default: vi.fn(),
}));

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

vi.mock('@shared/utils/pdfShare', () => ({
  shareOrSavePDF: vi.fn(),
}));

vi.mock('@features/reportes/pages/ReportesTab/usePlanWeeks', () => ({
  usePlanWeeks: vi.fn(() => ({ pre: [], pro: [] })),
}));

vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((_: string, initialValue: unknown) => [initialValue, vi.fn()]),
}));

import { extractWorkersFromWeek, getTimesheetRoleLabel } from './TimesheetTab';

describe('TimesheetTab helpers', () => {
  const t = (key: string) => {
    if (key === 'team.reinforcementPrefix') return 'Refuerzo';
    return key;
  };

  it('uses roleLabel from project catalog for display', () => {
    const project = {
      roleCatalog: {
        version: 1 as const,
        roles: [
          {
            id: 'electric_night',
            label: 'Eléctrico noche',
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
    };

    const label = getTimesheetRoleLabel(project, 'E', t, 'neutral', {
      roleId: 'electric_night',
      roleLabel: 'Eléctrico noche',
    });

    expect(label).toBe('Eléctrico noche');
  });

  it('uses gendered base role label for default catalog roles', () => {
    const t = (key: string, options?: { context?: string }) => {
      if (key === 'team.roles.E' && options?.context === 'male') return 'Eléctrico';
      if (key === 'team.roles.E' && options?.context === 'female') return 'Eléctrica';
      if (key === 'team.roles.E') return 'Electric@';
      return key;
    };

    const project = {
      roleCatalog: {
        version: 1 as const,
        roles: [
          {
            id: 'e_default',
            label: 'Eléctric@',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 2,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    };

    expect(getTimesheetRoleLabel(project, 'E', t, 'neutral', { roleId: 'e_default', roleLabel: 'Eléctric@' })).toBe('Electric@');
    expect(getTimesheetRoleLabel(project, 'E', t, 'male', { roleId: 'e_default', roleLabel: 'Eléctric@' })).toBe('Eléctrico');
    expect(getTimesheetRoleLabel(project, 'E', t, 'female', { roleId: 'e_default', roleLabel: 'Eléctric@' })).toBe('Eléctrica');
  });

  it('uses gendered base role label when an extra block preserves the neutral label but loses roleId', () => {
    const t = (key: string, options?: { context?: string }) => {
      if (key === 'team.roles.E' && options?.context === 'male') return 'Eléctrico';
      if (key === 'team.roles.E' && options?.context === 'female') return 'Eléctrica';
      if (key === 'team.roles.E' && options?.context === 'neutral') return 'Eléctric@';
      if (key === 'team.roles.E') return 'Eléctric@';
      return key;
    };

    expect(getTimesheetRoleLabel(undefined, 'E', t, 'male', { roleLabel: 'Eléctric@', source: 'base' })).toBe('Eléctrico');
  });

  it('does not append prelight when the worker is base crew scheduled in a prelight block', () => {
    const t = (key: string) => {
      if (key === 'team.reinforcementPrefix') return 'Refuerzo';
      if (key === 'needs.prelight') return 'Prelight';
      if (key === 'needs.pickup') return 'Recogida';
      return key;
    };

    const label = getTimesheetRoleLabel(undefined, 'EP', t, 'neutral', {
      roleLabel: 'Eléctrico factura',
      source: 'base',
    });

    expect(label).toBe('Eléctrico factura');
  });

  it('appends prelight only when the worker comes from the prelight roster', () => {
    const t = (key: string) => {
      if (key === 'team.reinforcementPrefix') return 'Refuerzo';
      if (key === 'needs.prelight') return 'Prelight';
      if (key === 'needs.pickup') return 'Recogida';
      return key;
    };

    const label = getTimesheetRoleLabel(undefined, 'E', t, 'neutral', {
      roleLabel: 'Eléctrico factura',
      source: 'pre',
    });

    expect(label).toBe('Eléctrico factura Prelight');
  });

  it('does not turn a base worker into reinforcement just because the raw role is REF*', () => {
    const t = (key: string) => {
      if (key === 'team.reinforcementPrefix') return 'Refuerzo';
      return key;
    };

    const label = getTimesheetRoleLabel(undefined, 'REFE', t, 'neutral', {
      roleLabel: 'Eléctrico/a',
      source: 'base',
    });

    expect(label).toBe('Eléctrico/a');
  });

  it('groups the same person once in timesheet even if they have two roleIds in the week', () => {
    const project = {
      roleCatalog: {
        version: 1 as const,
        roles: [
          {
            id: 'electric_night',
            label: 'Eléctrico noche',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 20,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
          {
            id: 'electric_day',
            label: 'Eléctrico día',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 21,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    };

    const week = {
      days: [
        {
          team: [
            { personId: 'ana_1', role: 'E', roleId: 'electric_night', roleLabel: 'Eléctrico noche', name: 'Ana' },
            { personId: 'ana_1', role: 'E', roleId: 'electric_day', roleLabel: 'Eléctrico día', name: 'Ana' },
          ],
        },
      ],
    };

    const workers = extractWorkersFromWeek(week, project);

    expect(workers).toHaveLength(1);
    expect(workers[0]?.name).toBe('Ana');
    expect(workers[0]?.personId).toBe('ana_1');
  });

  it('prefers source from project team over ref source inherited from calendar blocks', () => {
    const project = {
      team: {
        base: [{ personId: 'oriol_1', role: 'E', roleId: 'electric_default', roleLabel: 'Eléctrico', gender: 'male', name: 'Oriol' }],
        prelight: [],
        pickup: [],
        reinforcements: [],
      },
    };

    const week = {
      days: [
        {
          team: [{ personId: 'oriol_1', role: 'REFE', roleId: 'electric_default', name: 'Oriol', source: 'ref' }],
          refList: [{ personId: 'oriol_1', role: 'REFE', roleId: 'electric_default', name: 'Oriol', source: 'ref' }],
        },
      ],
    };

    const workers = extractWorkersFromWeek(week, project);

    expect(workers).toHaveLength(1);
    expect(workers[0]?.source).toBe('base');
    expect(workers[0]?.gender).toBe('male');
    expect(workers[0]?.roleLabel).toBe('Eléctrico');
  });
});
