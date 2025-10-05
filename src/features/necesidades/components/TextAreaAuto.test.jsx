import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import TextAreaAuto from './TextAreaAuto.tsx';

describe('TextAreaAuto (smoke)', () => {
  it('controla el valor y llama onChange', () => {
    const onChange = vi.fn();
    render(
      <TextAreaAuto value='hola' onChange={onChange} placeholder='escribe' />
    );
    const ta = screen.getByPlaceholderText('escribe');
    expect(ta).toHaveValue('hola');
    fireEvent.change(ta, { target: { value: 'nuevo' } });
    expect(onChange).toHaveBeenCalledWith('nuevo');
  });
});
