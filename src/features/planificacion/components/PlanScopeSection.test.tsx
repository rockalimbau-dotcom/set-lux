import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import PlanScopeSection from './PlanScopeSection.tsx';

vi.mock('./WeekCard', () => ({
  __esModule: true,
  default: ({ week, onExportWeek }) => (
    <div>
      <div>{week.label}</div>
      <button onClick={onExportWeek}>Exportar semana</button>
    </div>
  ),
}));

vi.mock('./Accordion', () => ({
  __esModule: true,
  default: ({
    title,
    open,
    onToggle,
    onAdd,
    onExport,
    children,
    btnExportCls,
    btnExportStyle,
  }) => (
    <section>
      <h4>{title}</h4>
      <button onClick={onExport}>Exportar</button>
      <button onClick={onAdd}>+ Semana</button>
      {open && <div>{children}</div>}
    </section>
  ),
}));

describe('PlanScopeSection (smoke)', () => {
  it('renders EmptyHint when no weeks, and WeekCard when weeks exist', () => {
    const commonProps = {
      title: 'Preproducción',
      open: true,
      onToggle: vi.fn(),
      onAdd: vi.fn(),
      onExport: vi.fn(),
      btnExportCls: 'btn',
      btnExportStyle: {},
      scope: 'pre',
      duplicateWeek: vi.fn(),
      deleteWeek: vi.fn(),
      setWeekStart: vi.fn(),
      setDayField: vi.fn(),
      addMemberTo: vi.fn(),
      removeMemberFrom: vi.fn(),
      teamList: [],
      baseTeam: [],
      prelightTeam: [],
      pickupTeam: [],
      reinforcements: [],
      onExportWeek: vi.fn(),
      emptyText: 'No hay semanas',
      containerId: 'pre',
      weeksOnlyId: 'pre-only',
    };

    // Empty
    const { rerender } = render(
      <PlanScopeSection {...commonProps} weeks={[]} />
    );
    expect(screen.getByText(/No hay semanas/i)).toBeInTheDocument();

    // With weeks
    const onExportWeek = vi.fn();
    rerender(
      <PlanScopeSection
        {...commonProps}
        weeks={[{ id: 'w1', label: 'Semana 1' }]}
        onExportWeek={onExportWeek}
      />
    );
    expect(screen.getByText('Semana 1')).toBeInTheDocument();
    screen.getByText('Exportar semana').click();
    expect(onExportWeek).toHaveBeenCalled();
  });
});
