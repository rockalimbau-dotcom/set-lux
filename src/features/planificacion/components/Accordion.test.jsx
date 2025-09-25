import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Accordion from './Accordion.tsx';

vi.mock('../../../shared/components/ToggleIconButton', () => ({
  __esModule: true,
  default: ({ isOpen, onClick, className }) => (
    <button title={isOpen ? 'Cerrar' : 'Abrir'} onClick={onClick} className={className}>
      {isOpen ? '−' : '+'}
    </button>
  ),
}));

describe('Accordion (smoke)', () => {
  it('renders title and buttons and triggers handlers', () => {
    const onToggle = vi.fn();
    const onAdd = vi.fn();
    const onExport = vi.fn();

    render(
      <Accordion
        title='Sección'
        open={true}
        onToggle={onToggle}
        onAdd={onAdd}
        onExport={onExport}
        btnExportCls='btn'
        btnExportStyle={{}}
      >
        <div>Contenido</div>
      </Accordion>
    );

    expect(screen.getByText('Sección')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Exportar/i }));
    expect(onExport).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '+ Semana' }));
    expect(onAdd).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Cerrar'));
    expect(onToggle).toHaveBeenCalled();
  });
});
