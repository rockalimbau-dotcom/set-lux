import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import FieldRow from './FieldRow.tsx';

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

vi.mock('./TextAreaAuto', () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder }) => (
    <textarea
      aria-label={placeholder || 'ta'}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  ),
}));

describe('FieldRow (smoke)', () => {
  it('dispara setCell al cambiar textarea', () => {
    const setCell = vi.fn();
    const weekObj = {
      days: [
        { loc: '' },
        { loc: '' },
        { loc: '' },
        { loc: '' },
        { loc: '' },
        { loc: '' },
        { loc: '' },
      ],
    };
    render(
      <FieldRow
        weekId='w1'
        weekObj={weekObj}
        fieldKey='loc'
        label='Localización'
        setCell={setCell}
      />
    );
    const tas = screen.getAllByRole('textbox');
    fireEvent.change(tas[0], { target: { value: 'A' } });
    expect(setCell).toHaveBeenCalledWith('w1', 0, 'loc', 'A');
  });
});
