import { describe, it, expect, vi } from 'vitest';

import { render, screen } from '../../test/utils';

import Button from './Button.tsx';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Test Button</Button>);

    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary Button</Button>);

    const button = screen.getByText('Primary Button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('applies danger variant', () => {
    render(<Button variant='danger'>Danger Button</Button>);

    const button = screen.getByText('Danger Button');
    expect(button).toHaveClass('bg-red-600');
  });

  it('applies ghost variant', () => {
    render(<Button variant='ghost'>Ghost Button</Button>);

    const button = screen.getByText('Ghost Button');
    expect(button).toHaveClass('bg-transparent');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);

    const button = screen.getByText('Clickable Button');
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });
});
