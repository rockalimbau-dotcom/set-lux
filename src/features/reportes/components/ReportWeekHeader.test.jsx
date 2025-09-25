import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportWeekHeader from './ReportWeekHeader.jsx';

describe('ReportWeekHeader (smoke)', () => {
  it('renders title and triggers actions', () => {
    const onToggle = vi.fn();
    const onExport = vi.fn();
    render(
      <ReportWeekHeader
        open={true}
        title='Semana A'
        onToggle={onToggle}
        onExport={onExport}
        btnExportCls='btn'
        btnExportStyle={{}}
      />
    );

    expect(screen.getByText('Semana A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Exportar semana' }));
    expect(onExport).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Alternar semana' }));
    expect(onToggle).toHaveBeenCalled();
  });
});
