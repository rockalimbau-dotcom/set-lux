import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import MaterialPropioTypeDropdown from './MaterialPropioTypeDropdown';

describe('MaterialPropioTypeDropdown', () => {
  it('allows selecting an option from the portal menu', () => {
    const onChange = vi.fn();

    render(
      <MaterialPropioTypeDropdown
        value='semanal'
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /semanal/i }));
    fireEvent.mouseDown(screen.getByRole('button', { name: /diario/i }));
    fireEvent.click(screen.getByRole('button', { name: /diario/i }));

    expect(onChange).toHaveBeenCalledWith('diario');
  });
});
