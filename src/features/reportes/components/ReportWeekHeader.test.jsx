import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import ReportWeekHeader from './ReportWeekHeader.jsx';

describe('ReportWeekHeader (smoke)', () => {
  it('renders title and triggers actions', () => {
    const onToggle = vi.fn();
    const onExportPDF = vi.fn();
    render(
      <ReportWeekHeader
        open={true}
        title='Semana A'
        onToggle={onToggle}
        onExportPDF={onExportPDF}
        btnExportCls='btn'
        btnExportStyle={{}}
      />
    );

    expect(screen.getByText('Semana A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'PDF' }));
    expect(onExportPDF).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Alternar semana' }));
    expect(onToggle).toHaveBeenCalled();
  });
});
