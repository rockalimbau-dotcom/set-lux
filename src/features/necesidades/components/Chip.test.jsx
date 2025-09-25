import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Chip from './Chip.tsx';

describe('Chip (smoke)', () => {
  it('renderiza y llama onRemove al click', () => {
    const onRemove = vi.fn();
    render(<Chip role='G' name='John Doe' onRemove={onRemove} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Quitar'));
    expect(onRemove).toHaveBeenCalled();
  });
});


