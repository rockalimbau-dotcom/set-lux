import { describe, it, expect, vi } from 'vitest';

import { render, screen } from '../../test/utils';

import Input from './Input.tsx';

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input placeholder='Test input' />);

    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Input placeholder='Default input' />);

    const input = screen.getByPlaceholderText('Default input');
    expect(input).toHaveClass('bg-black/40');
  });

  it('applies search variant', () => {
    render(<Input variant='search' placeholder='Search input' />);

    const input = screen.getByPlaceholderText('Search input');
    expect(input).toHaveClass('bg-gray-800');
  });

  it('accepts value prop', () => {
    render(<Input value='test value' placeholder='Value input' />);

    const input = screen.getByPlaceholderText('Value input');
    expect(input).toHaveValue('test value');
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder='Disabled input' />);

    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('supports different input types', () => {
    render(<Input type='password' placeholder='Password input' />);

    const input = screen.getByPlaceholderText('Password input');
    expect(input).toHaveAttribute('type', 'password');
  });
});
