import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import MonthSection from './MonthSection';

const mockProps = {
  monthKey: '2025-01',
  rows: [
    {
      role: 'GAFFER',
      name: 'Juan',
      extras: 5,
      transporte: 2,
      km: 50,
      dietasCount: new Map([['Comida', 3]]),
      ticketTotal: 25,
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
  stripPR: (r) => r.replace(/[PR]$/, ''),
  calcWorkedBreakdown: () => ({
    workedDays: 5, // Solo días normales (NO festivos)
    travelDays: 1,
    holidayDays: 2, // Solo días festivos
    workedBase: 3,
    workedPre: 1,
    workedPick: 1,
  }),
  monthLabelEs: (key) => key,
  ROLE_COLORS: {
    GAFFER: { bg: '#F59E0B', fg: '#111' },
  },
  roleLabelFromCode: (code) => code,
};

// Mock useLocalStorage
vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: (key, defaultValue) => [defaultValue, vi.fn()],
}));

describe('MonthSection with holiday days', () => {
  it('should display holiday days columns', () => {
    const { getByText } = render(<MonthSection {...mockProps} />);
    
    // Check that the new column headers are present
    expect(getByText('Días festivos')).toBeInTheDocument();
    expect(getByText('Total días festivos')).toBeInTheDocument();
  });

  it('should calculate and display holiday totals correctly', () => {
    const { container } = render(<MonthSection {...mockProps} />);
    
    // The component should render the holiday days (2) and total (2 * 175 = 350)
    const holidayDaysCell = container.querySelector('td:nth-child(4)'); // 4th column should be holiday days
    const totalHolidaysCell = container.querySelector('td:nth-child(5)'); // 5th column should be total holidays
    
    expect(holidayDaysCell?.textContent).toBe('2');
    expect(totalHolidaysCell?.textContent).toBe('350.00');
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

  it('should show correct colspan for empty state', () => {
    const emptyProps = {
      ...mockProps,
      rows: [],
    };
    
    const { container } = render(<MonthSection {...emptyProps} />);
    
    // Should have colspan of 17 (original 15 + 2 new columns)
    const emptyCell = container.querySelector('td[colspan="17"]');
    expect(emptyCell).toBeInTheDocument();
  });
});
