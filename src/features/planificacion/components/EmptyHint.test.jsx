import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import EmptyHint from './EmptyHint.tsx';

describe('EmptyHint (smoke)', () => {
  it('renders provided text', () => {
    render(<EmptyHint text='No hay semanas' />);
    expect(screen.getByText(/No hay semanas/i)).toBeInTheDocument();
  });
});
