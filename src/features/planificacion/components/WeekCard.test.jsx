import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import WeekCard from './WeekCard.tsx';

vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key, initialValue) => {
    const [value, setValue] = React.useState(
      initialValue instanceof Function ? initialValue() : initialValue
    );
    return [value, setValue];
  }),
}));

describe('WeekCard (smoke)', () => {
  const week = {
    id: 'w1',
    label: 'Semana 1',
    startDate: '2024-01-01',
    days: Array.from({ length: 7 }).map((_, i) => ({
      name: `D${i}`,
      tipo: 'Rodaje',
    })),
  };

  it('renders header and actions', () => {
    const onExportWeekPDF = vi.fn();
    const duplicateWeek = vi.fn();
    const deleteWeek = vi.fn();
    const setWeekStart = vi.fn();
    const setDayField = vi.fn();
    const addMemberTo = vi.fn();
    const removeMemberFrom = vi.fn();

    render(
      <WeekCard
        scope='pro'
        week={week}
        duplicateWeek={duplicateWeek}
        deleteWeek={deleteWeek}
        setWeekStart={setWeekStart}
        setDayField={setDayField}
        addMemberTo={addMemberTo}
        removeMemberFrom={removeMemberFrom}
        baseTeam={[]}
        prelightTeam={[]}
        pickupTeam={[]}
        reinforcements={[]}
        onExportWeekPDF={onExportWeekPDF}
        teamList={[]}
      />
    );

    expect(screen.getByText('Semana 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /PDF/i }));
    expect(onExportWeekPDF).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Duplicar' }));
    expect(duplicateWeek).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Eliminar semana'));
    expect(deleteWeek).toHaveBeenCalled();
  });
});
