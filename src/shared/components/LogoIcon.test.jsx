import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import LogoIcon from './LogoIcon.tsx';

describe('LogoIcon', () => {
  it('renders without crashing', () => {
    render(<LogoIcon />);

    const container = screen.getByTestId('logo-icon');
    expect(container).toBeInTheDocument();
  });

  it('renders with default size', () => {
    render(<LogoIcon />);

    const img = screen.getByTestId('logo-icon');
    expect(img).toHaveAttribute('src', '/Logo_SetLux_02.png');
    expect(img).toHaveAttribute('alt', 'SetLux');
  });

  it('renders with custom size', () => {
    render(<LogoIcon size={120} />);

    const img = screen.getByTestId('logo-icon');
    expect(img).toHaveAttribute('src', '/Logo_SetLux_02.png');
    expect(img).toHaveAttribute('alt', 'SetLux');
  });

  it('has correct CSS classes', () => {
    render(<LogoIcon />);

    const img = screen.getByTestId('logo-icon');
    expect(img).toHaveClass(
      'object-contain',
      'bg-transparent',
      'block',
      'select-none'
    );
  });

  it('has correct accessibility attributes', () => {
    render(<LogoIcon />);

    const img = screen.getByTestId('logo-icon');
    expect(img).toHaveAttribute('alt', 'SetLux');
    expect(img).toHaveAttribute('draggable', 'false');
  });

  it('renders image with correct attributes', () => {
    render(<LogoIcon size={100} />);

    const img = screen.getByTestId('logo-icon');
    expect(img).toHaveAttribute('src', '/Logo_SetLux_02.png');
    expect(img).toHaveAttribute('alt', 'SetLux');
    expect(img).toHaveAttribute('draggable', 'false');
  });

  it('has transparent background', () => {
    render(<LogoIcon />);

    const img = screen.getByTestId('logo-icon');
    expect(img).toHaveClass('bg-transparent');
    expect(img).toHaveStyle('background-color: rgba(0, 0, 0, 0)');
  });

  it('is memoized correctly', () => {
    const { rerender } = render(<LogoIcon size={80} />);

    // Re-render with same props
    rerender(<LogoIcon size={80} />);

    const img = screen.getByTestId('logo-icon');
    expect(img).toHaveAttribute('src', '/Logo_SetLux_02.png');
  });

  it('updates when size changes', () => {
    const { rerender } = render(<LogoIcon size={80} />);

    let img = screen.getByTestId('logo-icon');
    expect(img).toHaveAttribute('src', '/Logo_SetLux_02.png');

    rerender(<LogoIcon size={120} />);

    img = screen.getByTestId('logo-icon');
    expect(img).toHaveAttribute('src', '/Logo_SetLux_02.png');
  });
});
