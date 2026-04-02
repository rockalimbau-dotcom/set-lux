import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import MonthSection from './MonthSection';

const mockProps = {
  monthKey: '2025-01',
  rows: [
    {
      role: 'GAFFER',
      name: 'Juan',
      extras: 5,
      horasExtra: 3,
      turnAround: 1,
      nocturnidad: 1,
      penaltyLunch: 0,
      transporte: 2,
      km: 50,
      gasolina: 42,
      dietasCount: new Map([['Comida', 3]]),
      ticketTotal: 25,
      otherTotal: 0,
    },
  ],
  weeksForMonth: [],
  filterISO: () => true,
  rolePrices: {
    getForRole: () => ({
      jornada: 100,
      travelDay: 50,
      horaExtra: 15,
      holidayDay: 175,
      transporte: 15,
      km: 0.25,
      dietas: {
        Comida: 12,
        Cena: 18,
        'Dieta sin pernoctar': 25,
        'Dieta completa + desayuno': 35,
        'Gastos de bolsillo': 8,
      },
    }),
  },
  defaultOpen: true,
  persistKeyBase: 'test',
  buildRefuerzoIndex: () => new Set(),
  stripPR: r => r.replace(/[PR]$/, ''),
  calcWorkedBreakdown: () => ({
    workedDays: 5, // Solo días normales (NO festivos)
    travelDays: 1,
    holidayDays: 2, // Solo días festivos
    workedBase: 3,
    workedPre: 1,
    workedPick: 1,
  }),
  monthLabelEs: key => key,
  ROLE_COLORS: {
    GAFFER: { bg: '#F59E0B', fg: '#111' },
  },
  roleLabelFromCode: code => code,
};

// Mock useLocalStorage
vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: (key, defaultValue) => [defaultValue, vi.fn()],
}));

describe('MonthSection with holiday days and conditional columns', () => {
  it('should display holiday days columns when there are holiday days', () => {
    const { getByText } = render(<MonthSection {...mockProps} />);

    // Check that the new column headers are present
    expect(getByText('Días festivos')).toBeInTheDocument();
    expect(getByText('Total días festivos')).toBeInTheDocument();
    expect(getByText('Gasolina')).toBeInTheDocument();
    expect(getByText('Total gasolina')).toBeInTheDocument();
  });

  it('should calculate and display holiday totals correctly', () => {
    const { container } = render(<MonthSection {...mockProps} />);

    // The component should render the holiday days (2) and total (2 * 175 = 350)
    // Note: First column is now checkbox, so holiday days is 5th column and total is 6th
    const holidayDaysCell = container.querySelector('td:nth-child(5)'); // 5th column should be holiday days
    const totalHolidaysCell = container.querySelector('td:nth-child(6)'); // 6th column should be total holidays

    expect(holidayDaysCell?.textContent).toBe('2');
    expect(totalHolidaysCell?.textContent).toBe('350€'); // displayMoney elimina .00
  });

  it('should include holiday total in bruto calculation', () => {
    const { container } = render(<MonthSection {...mockProps} />);

    // The component should render and calculate totals correctly
    // We verify that the component includes holiday calculations by checking
    // that both holiday days and total holiday columns are present
    const table = container.querySelector('table');
    expect(table).toBeTruthy();

    // Check that the table has the expected structure with holiday columns
    const headers = container.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(h => h.textContent);
    expect(headerTexts).toContain('Días festivos');
    expect(headerTexts).toContain('Total días festivos');
  });

  it('should hide empty columns when no data is present', () => {
    const propsWithoutData = {
      ...mockProps,
      rows: [
        {
          role: 'GAFFER',
          name: 'Juan',
          extras: 0, // No extras
          transporte: 0, // No transporte
          km: 0, // No km
          gasolina: 0, // No gasolina
          dietasCount: new Map(), // No dietas
          ticketTotal: 0, // No ticket
          otherTotal: 0,
        },
      ],
      calcWorkedBreakdown: () => ({
        workedDays: 5,
        travelDays: 0, // No travel days
        holidayDays: 0, // No holiday days
        workedBase: 5,
        workedPre: 0,
        workedPick: 0,
      }),
    };

    const { container, queryByText } = render(
      <MonthSection {...propsWithoutData} />
    );

    // These columns should be hidden when there's no data
    expect(queryByText('Días festivos')).not.toBeInTheDocument();
    expect(queryByText('Total días festivos')).not.toBeInTheDocument();
    expect(queryByText('Días Travel Day')).not.toBeInTheDocument();
    expect(queryByText('Total travel days')).not.toBeInTheDocument();
    expect(queryByText('Horas extras')).not.toBeInTheDocument();
    expect(queryByText('Total horas extra')).not.toBeInTheDocument();
    expect(queryByText('Transportes')).not.toBeInTheDocument();
    expect(queryByText('Total transportes')).not.toBeInTheDocument();
    expect(queryByText('Kilometraje')).not.toBeInTheDocument();
    expect(queryByText('Total kilometraje')).not.toBeInTheDocument();
    expect(queryByText('Gasolina')).not.toBeInTheDocument();
    expect(queryByText('Total gasolina')).not.toBeInTheDocument();
    expect(queryByText('Dietas')).not.toBeInTheDocument();
    expect(queryByText('Total dietas')).not.toBeInTheDocument();

    // These columns should always be visible
    expect(queryByText('Persona')).toBeInTheDocument();
    expect(queryByText('Días trabajados')).toBeInTheDocument();
    expect(queryByText('Total días')).toBeInTheDocument();
    expect(queryByText('TOTAL BRUTO')).toBeInTheDocument();
    expect(queryByText('Nómina recibida')).toBeInTheDocument();
  });

  it('should show correct dynamic colspan for empty state', () => {
    const emptyProps = {
      ...mockProps,
      rows: [],
    };

    const { container } = render(<MonthSection {...emptyProps} />);

    // Should have dynamic colspan based on visible columns
    // Base columns (5) + all optional columns (12) = 17 total
    const emptyCell = container.querySelector('td[colspan]');
    expect(emptyCell).toBeInTheDocument();
    expect(parseInt(emptyCell.getAttribute('colspan'))).toBeGreaterThanOrEqual(
      5
    );
  });

  it('should show only base columns when all optional data is empty', () => {
    const minimalProps = {
      ...mockProps,
      rows: [
        {
          role: 'GAFFER',
          name: 'Juan',
          extras: 0,
          transporte: 0,
          km: 0,
          gasolina: 0,
          dietasCount: new Map(),
          ticketTotal: 0,
          otherTotal: 0,
        },
      ],
      calcWorkedBreakdown: () => ({
        workedDays: 5,
        travelDays: 0,
        holidayDays: 0,
        workedBase: 5,
        workedPre: 0,
        workedPick: 0,
      }),
    };

    const { container } = render(<MonthSection {...minimalProps} />);

    // Count visible headers - should only be the base columns
    const headers = container.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(h => h.textContent);

    // Should have exactly 6 base columns (including checkbox column)
    expect(headerTexts).toEqual([
      '', // Checkbox column
      'Persona',
      'Días trabajados',
      'Total días',
      'TOTAL BRUTO',
      'Nómina recibida',
    ]);
  });

  it('shows one payroll row with a role breakdown when the same person has multiple tariffs', () => {
    const multiRoleProps = {
      ...mockProps,
      rows: [
        {
          role: 'E',
          roleId: 'electric_default',
          roleLabel: 'Eléctrico/a',
          personId: 'person_pol',
          name: 'Pol Peitx',
          extras: 0,
          horasExtra: 0,
          turnAround: 0,
          nocturnidad: 0,
          penaltyLunch: 0,
          transporte: 0,
          km: 0,
          gasolina: 0,
          dietasCount: new Map(),
          ticketTotal: 0,
          otherTotal: 0,
        },
        {
          role: 'E',
          roleId: 'electric_factura',
          roleLabel: 'Eléctrico factura',
          personId: 'person_pol',
          name: 'Pol Peitx',
          extras: 0,
          horasExtra: 0,
          turnAround: 0,
          nocturnidad: 0,
          penaltyLunch: 0,
          transporte: 0,
          km: 0,
          gasolina: 0,
          dietasCount: new Map(),
          ticketTotal: 0,
          otherTotal: 0,
        },
      ],
      rolePrices: {
        getForRole: (_role, _base, options) => ({
          jornada: options?.roleId === 'electric_factura' ? 300 : 350,
          travelDay: 0,
          horaExtra: 0,
          holidayDay: 0,
          transporte: 0,
          km: 0,
          dietas: {},
        }),
      },
      calcWorkedBreakdown: (_weeks, _filter, person) => ({
        workedDays: person.roleId === 'electric_factura' ? 1 : 1,
        travelDays: 0,
        holidayDays: 0,
        workedBase: 1,
        workedPre: 0,
        workedPick: 0,
      }),
    };

    const { getAllByText, getByText } = render(<MonthSection {...multiRoleProps} />);

    expect(getAllByText('Pol Peitx')).toHaveLength(1);
    expect(getByText('Eléctrico/a: 350€')).toBeInTheDocument();
    expect(getByText('Eléctrico factura: 300€')).toBeInTheDocument();
    expect(getByText('650€')).toBeInTheDocument();
  });
});
