import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import ListRow from './ListRow.tsx';

vi.mock('@shared/components', () => ({
  Row: ({ label, children }) => (
    <table>
      <tbody>
        <tr>
          <td>{label}</td>
          {children}
        </tr>
      </tbody>
    </table>
  ),
  Td: ({ children }) => <td>{children}</td>,
}));

vi.mock('./Chip', () => ({
  __esModule: true,
  default: ({ name, onRemove }) => (
    <button onClick={onRemove} aria-label={`chip-${name}`}>
      {name}
    </button>
  ),
}));

vi.mock('./TextAreaAuto', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      aria-label='notes'
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  ),
}));

describe('ListRow (smoke)', () => {
  it('muestra chips y llama removeFromList', () => {
    const removeFromList = vi.fn();
    const setCell = vi.fn();
    const weekObj = { days: [{ crewList: [{ role: 'G', name: 'John' }] }] };
    render(
      <ListRow
        label='Equipo base'
        listKey='crewList'
        notesKey='crewTxt'
        weekId='w1'
        weekObj={weekObj}
        context='prelight'
        removeFromList={removeFromList}
        setCell={setCell}
      />
    );
    const chip = screen.getByRole('button', { name: 'chip-John' });
    fireEvent.click(chip);
    
    // Ahora hay un modal de confirmación, buscar el botón "Sí"
    const confirmButton = screen.getByText('Sí');
    expect(confirmButton).toBeInTheDocument();
    
    // Confirmar la eliminación
    fireEvent.click(confirmButton);
    expect(removeFromList).toHaveBeenCalledWith('w1', 0, 'crewList', 0);
  });
});
