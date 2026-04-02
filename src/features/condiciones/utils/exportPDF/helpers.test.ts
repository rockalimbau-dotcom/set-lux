import { filterRolesWithPrices, generatePriceTableHTML } from './helpers';

describe('conditions export PDF helpers', () => {
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
          id: 'e_noche',
          label: 'Eléctrico noche',
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

  it('filters roles with prices using model roles and project ordering', () => {
    const roles = filterRolesWithPrices(
      project,
      ['Gaffer', 'Eléctrico'],
      ['Precio jornada'],
      {
        roles: ['g_default', 'e_noche'],
        prices: {
          g_default: { 'Precio jornada': '100' },
          e_noche: { 'Precio jornada': '200' },
        },
      },
      'base'
    );

    expect(roles).toEqual(['g_default', 'e_noche']);
  });

  it('renders project role labels in table html', () => {
    const html = generatePriceTableHTML(
      project,
      ['e_noche'],
      ['Precio jornada'],
      {
        roles: ['e_noche'],
        prices: {
          e_noche: { 'Precio jornada': '200' },
        },
      },
      'base',
      'Equipo Base'
    );

    expect(html).toContain('Eléctrico noche');
    expect(html).toContain('200');
  });
});
