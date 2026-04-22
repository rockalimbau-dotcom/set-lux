import {
  getConditionRoleLabel,
  getConditionRoleOptions,
  getTranslatedConditionRoleLabel,
  normalizeConditionModel,
  normalizeConditionRoleKey,
} from './roleCatalog';

describe('condition role catalog helpers', () => {
  const project = {
    roleCatalog: {
      version: 1 as const,
      roles: [
        {
          id: 'g_default',
          label: 'Gaffer',
          legacyCode: 'G',
          baseRole: 'G',
          sortOrder: 0,
          active: true,
          supportsPrelight: true,
          supportsPickup: true,
          supportsRefuerzo: true,
        },
        {
          id: 'e_default',
          label: 'Eléctrico base',
          legacyCode: 'E',
          baseRole: 'E',
          sortOrder: 1,
          active: true,
          supportsPrelight: true,
          supportsPickup: true,
          supportsRefuerzo: true,
        },
        {
          id: 'e_noche',
          label: 'Eléctrico noche',
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

  it('normaliza claves legacy a roleId', () => {
    expect(normalizeConditionRoleKey(project, 'Eléctrico')).toBe('e_default');
  });

  it('prioriza el rol base cuando hay varios roles con el mismo legacyCode', () => {
    const projectWithSortedCollision = {
      roleCatalog: {
        version: 1 as const,
        roles: [
          {
            id: 'e_x',
            label: 'Eléctrico X',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 1,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
          {
            id: 'e_default',
            label: 'Eléctrico/a',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 1,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    };

    const normalized = normalizeConditionModel(projectWithSortedCollision, {
      roles: ['Eléctrico', 'e_x'],
      prices: {
        'Eléctrico': { 'Precio semanal': '200' },
        e_x: { 'Precio semanal': '300' },
      },
    });

    expect(normalized.roles).toContain('e_default');
    expect(normalized.roles).toContain('e_x');
    expect(normalized.prices.e_default['Precio semanal']).toBe('200');
    expect(normalized.prices.e_x['Precio semanal']).toBe('300');
  });

  it('devuelve labels desde roleCatalog', () => {
    expect(getConditionRoleLabel(project, 'e_noche')).toBe('Eléctrico noche');
    expect(getConditionRoleLabel(project, 'e_noche', 'prelight')).toBe('Eléctrico noche Prelight');
  });

  it('traduce roles estándar y conserva roles personalizados', () => {
    const t = (key: string) => {
      if (key === 'team.roles.E') return 'Set Lighting Technician / Electrician';
      return key;
    };

    expect(getTranslatedConditionRoleLabel(project, 'e_default', undefined, t)).toBe(
      'Set Lighting Technician / Electrician'
    );
    expect(getTranslatedConditionRoleLabel(project, 'e_noche', undefined, t)).toBe(
      'Eléctrico noche'
    );
  });

  it('normaliza roles y prices del modelo legado', () => {
    const normalized = normalizeConditionModel(project, {
      roles: ['Gaffer', 'Eléctrico', 'e_noche'],
      prices: {
        Gaffer: { 'Precio semanal': '100' },
        'Eléctrico': { 'Precio semanal': '200' },
        e_noche: { 'Precio semanal': '300' },
      },
    });

    expect(normalized.roles).toEqual(['g_default', 'e_default', 'e_noche']);
    expect(normalized.prices.g_default['Precio semanal']).toBe('100');
    expect(normalized.prices.e_default['Precio semanal']).toBe('200');
    expect(normalized.prices.e_noche['Precio semanal']).toBe('300');
  });

  it('ofrece opciones activas del catálogo', () => {
    const optionKeys = getConditionRoleOptions(project).map(option => option.key);
    expect(optionKeys).toContain('g_default');
    expect(optionKeys).toContain('e_default');
    expect(optionKeys).toContain('e_noche');
  });
});
